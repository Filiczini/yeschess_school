import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from './db/index.js'
import { user, coachProfile, enrollment, lead, studentProfile, coachSchedule, booking } from './db/schema.js'
import { eq, sql, asc, and, gte, lt, ne } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { auth } from './auth.js'

const SELF_ASSIGNABLE_ROLES = ['student', 'parent', 'coach'] as const
type SelfAssignableRole = typeof SELF_ASSIGNABLE_ROLES[number]

const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      keywords: ['example'], // allow OpenAPI "example" keyword in schemas
    },
  },
})

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'YesChess API',
      description: 'REST API для школи шахів YesChess. Сесійна аутентифікація через cookie (Better Auth).',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey' as const,
          in: 'cookie',
          name: 'better-auth.session_token',
          description: 'Сесійний cookie, встановлюється автоматично після POST /api/auth/sign-in/email',
        },
      },
    },
    security: [{ cookieAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Аутентифікація (Better Auth)' },
      { name: 'Users', description: 'Поточний користувач' },
      { name: 'Coach', description: 'Профіль та розклад тренера' },
      { name: 'Schedule', description: 'Розклад та бронювання занять' },
      { name: 'Student', description: 'Профіль учня та його заняття' },
      { name: 'Admin', description: 'Адміністрування (admin / super_admin)' },
      { name: 'Enrollments', description: 'Призначення учнів до тренерів' },
      { name: 'Public', description: 'Публічні ендпоінти без авторизації' },
    ],
  },
})

await app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
  staticCSP: true,
})

// Shared error schema — must be registered before routes
app.addSchema({
  $id: 'Error',
  type: 'object',
  properties: { error: { type: 'string' } },
})

// Helper: get session from request headers
async function getSession(req: { headers: Record<string, string | string[] | undefined> }) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value[0] : value)
  }
  return auth.api.getSession({ headers })
}

// ── Auth ──────────────────────────────────────────────────────────────────────

// Better Auth — converts Fastify request to Web API Request
app.all('/api/auth/*', async (req, reply) => {
  const url = `http://${req.headers.host}${req.url}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value[0] : value)
  }

  const body =
    req.method !== 'GET' && req.method !== 'HEAD' && req.body != null
      ? JSON.stringify(req.body)
      : undefined

  const webRequest = new Request(url, { method: req.method, headers, body })
  const response = await auth.handler(webRequest)

  reply.status(response.status)
  response.headers.forEach((value, key) => reply.header(key, value))
  return reply.send(await response.text())
})

// ── Users ─────────────────────────────────────────────────────────────────────

// Set role after registration — coach gets pending status
app.patch('/api/users/me/role', {
  schema: {
    tags: ['Users'],
    summary: 'Встановити роль після реєстрації',
    description: 'Дозволені ролі: student, parent, coach. Тренер отримує статус pending до підтвердження адміном.',
    security: [{ cookieAuth: [] }],
    body: {
      type: 'object',
      required: ['role'],
      properties: {
        role: { type: 'string', enum: ['student', 'parent', 'coach'], description: 'Роль користувача' },
        phone: { type: 'string', description: 'Номер телефону' },
        contactMethod: { type: 'string', description: 'Спосіб зв\'язку (telegram, viber тощо)' },
        instagram: { type: 'string', description: 'Instagram нікнейм' },
      },
    },
    response: {
      200: {
        description: 'Роль успішно встановлена',
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          status: { type: 'string', enum: ['active', 'pending'] },
        },
      },
      400: { $ref: 'Error#' },
      401: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const { role, phone, contactMethod, instagram } = req.body as {
    role: string
    phone?: string
    contactMethod?: string
    instagram?: string
  }
  if (!SELF_ASSIGNABLE_ROLES.includes(role as SelfAssignableRole)) {
    return reply.status(400).send({ error: 'Invalid role' })
  }

  const status = role === 'coach' ? 'pending' : 'active'
  await db.update(user).set({
    role: role as SelfAssignableRole,
    status,
    phone: phone ?? null,
    contactMethod: contactMethod ?? null,
    instagram: instagram ?? null,
  }).where(eq(user.id, session.user.id))
  return reply.send({ ok: true, status })
})

// Current user profile
app.get('/api/users/me', {
  schema: {
    tags: ['Users'],
    summary: 'Отримати профіль поточного користувача',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        description: 'Профіль користувача',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['student', 'parent', 'coach', 'school_owner', 'admin', 'super_admin'] },
          status: { type: 'string', enum: ['active', 'pending', 'suspended'] },
          plan: { type: 'string', enum: ['free', 'pro', 'elite'] },
        },
      },
      401: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [u] = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    plan: user.plan,
  }).from(user).where(eq(user.id, session.user.id))

  return reply.send(u)
})

// ── Coach ─────────────────────────────────────────────────────────────────────

// Get own coach profile
app.get('/api/coach/profile', {
  schema: {
    tags: ['Coach'],
    summary: 'Отримати власний профіль тренера',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        description: 'Профіль тренера або null якщо не існує',
        nullable: true,
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string' },
          bio: { type: 'string', nullable: true },
          title: { type: 'string', nullable: true, enum: ['CM', 'NM', 'FM', 'IM', 'GM', 'WFM', 'WIM', 'WGM'] },
          fideRating: { type: 'integer', nullable: true },
          hourlyRate: { type: 'string', description: 'Ставка за годину (decimal string)' },
          currency: { type: 'string' },
          languages: { type: 'array', items: { type: 'string' } },
          specializations: { type: 'array', items: { type: 'string' } },
          isVerified: { type: 'boolean' },
          isVisible: { type: 'boolean' },
          avgRating: { type: 'string', nullable: true },
          totalReviews: { type: 'integer' },
        },
      },
      401: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [profile] = await db
    .select()
    .from(coachProfile)
    .where(eq(coachProfile.userId, session.user.id))

  return reply.send(profile ?? null)
})

// Create or update own coach profile
app.put('/api/coach/profile', {
  schema: {
    tags: ['Coach'],
    summary: 'Створити або оновити профіль тренера',
    security: [{ cookieAuth: [] }],
    body: {
      type: 'object',
      required: ['hourlyRate'],
      properties: {
        bio: { type: 'string', description: 'Біографія' },
        title: { type: 'string', nullable: true, enum: ['CM', 'NM', 'FM', 'IM', 'GM', 'WFM', 'WIM', 'WGM'] },
        fideRating: { type: 'integer', minimum: 0, maximum: 3500 },
        hourlyRate: { type: 'string', description: 'Ставка за годину (наприклад "500.00")' },
        languages: { type: 'array', items: { type: 'string' }, description: 'Мови викладання' },
        specializations: { type: 'array', items: { type: 'string' }, description: 'Спеціалізації' },
      },
    },
    response: {
      200: { description: 'Профіль оновлено', type: 'object' },
      201: { description: 'Профіль створено', type: 'object' },
      400: { $ref: 'Error#' },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || me.role !== 'coach') {
    return reply.status(403).send({ error: 'Only coaches can update coach profile' })
  }

  const { bio, title, fideRating, hourlyRate, languages, specializations } =
    req.body as {
      bio?: string
      title?: string
      fideRating?: number
      hourlyRate: string
      languages?: string[]
      specializations?: string[]
    }

  if (!hourlyRate) {
    return reply.status(400).send({ error: 'hourlyRate is required' })
  }

  const values = {
    userId: session.user.id,
    bio: bio ?? null,
    title: (title || null) as typeof coachProfile.title._.data,
    fideRating: fideRating ?? null,
    hourlyRate,
    languages: languages ?? [],
    specializations: specializations ?? [],
  }

  const [existing] = await db
    .select({ id: coachProfile.id })
    .from(coachProfile)
    .where(eq(coachProfile.userId, session.user.id))

  if (existing) {
    const [updated] = await db
      .update(coachProfile)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(coachProfile.userId, session.user.id))
      .returning()
    return reply.send(updated)
  }

  const [created] = await db.insert(coachProfile).values(values).returning()
  return reply.status(201).send(created)
})

// Get own students list (for coaches)
app.get('/api/coach/students', {
  schema: {
    tags: ['Coach'],
    summary: 'Список учнів тренера',
    description: 'Повертає всіх учнів, призначених до поточного тренера, разом з їх профілями.',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        description: 'Список учнів',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            enrollmentId: { type: 'string', format: 'uuid' },
            studentId: { type: 'string' },
            studentName: { type: 'string' },
            studentEmail: { type: 'string', format: 'email' },
            enrolledAt: { type: 'string', format: 'date-time' },
            notes: { type: 'string', nullable: true },
            level: { type: 'string', nullable: true, enum: ['beginner', 'intermediate', 'advanced'] },
            fideRating: { type: 'integer', nullable: true },
            clubRating: { type: 'integer', nullable: true },
            chesscomUsername: { type: 'string', nullable: true },
            lichessUsername: { type: 'string', nullable: true },
          },
        },
      },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [profile] = await db
    .select({ id: coachProfile.id })
    .from(coachProfile)
    .where(eq(coachProfile.userId, session.user.id))

  if (!profile) return reply.status(403).send({ error: 'Coach profile not found' })

  const studentUser = alias(user, 'student_user')

  const rows = await db
    .select({
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      studentName: studentUser.name,
      studentEmail: studentUser.email,
      enrolledAt: enrollment.createdAt,
      notes: enrollment.notes,
      level: studentProfile.level,
      fideRating: studentProfile.fideRating,
      clubRating: studentProfile.clubRating,
      chesscomUsername: studentProfile.chesscomUsername,
      lichessUsername: studentProfile.lichessUsername,
    })
    .from(enrollment)
    .innerJoin(studentUser, eq(enrollment.studentId, studentUser.id))
    .leftJoin(studentProfile, eq(enrollment.studentId, studentProfile.userId))
    .where(eq(enrollment.coachId, profile.id))
    .orderBy(asc(studentUser.name))

  return reply.send(rows)
})

// ── Schedule & Booking ────────────────────────────────────────────────────────

// Get own coach schedule
app.get('/api/coach/schedule', {
  schema: {
    tags: ['Schedule'],
    summary: 'Отримати тижневий розклад тренера',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        description: 'Масив слотів по днях тижня (0=Пн … 6=Нд)',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            coachId: { type: 'string', format: 'uuid' },
            dayOfWeek: { type: 'integer', minimum: 0, maximum: 6, description: '0=Пн, 6=Нд' },
            startTime: { type: 'string', example: '09:00' },
            endTime: { type: 'string', example: '18:00' },
            slotDuration: { type: 'integer', description: 'Тривалість слота в хвилинах' },
            isActive: { type: 'boolean' },
          },
        },
      },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [profile] = await db
    .select({ id: coachProfile.id })
    .from(coachProfile)
    .where(eq(coachProfile.userId, session.user.id))

  if (!profile) return reply.status(403).send({ error: 'Coach profile not found' })

  const rows = await db
    .select()
    .from(coachSchedule)
    .where(eq(coachSchedule.coachId, profile.id))
    .orderBy(asc(coachSchedule.dayOfWeek))

  return reply.send(rows)
})

// Save coach schedule (upsert per day)
app.put('/api/coach/schedule', {
  schema: {
    tags: ['Schedule'],
    summary: 'Зберегти тижневий розклад тренера',
    description: 'Upsert: надсилай всі 7 днів або тільки ті що змінились.',
    security: [{ cookieAuth: [] }],
    body: {
      type: 'array',
      items: {
        type: 'object',
        required: ['dayOfWeek', 'startTime', 'endTime', 'slotDuration', 'isActive'],
        properties: {
          dayOfWeek: { type: 'integer', minimum: 0, maximum: 6, description: '0=Пн, 6=Нд' },
          startTime: { type: 'string', pattern: '^[0-2]\\d:[0-5]\\d$', example: '09:00' },
          endTime: { type: 'string', pattern: '^[0-2]\\d:[0-5]\\d$', example: '18:00' },
          slotDuration: { type: 'integer', enum: [30, 45, 60, 90], description: 'Хвилини' },
          isActive: { type: 'boolean' },
        },
      },
    },
    response: {
      200: {
        description: 'Розклад збережено',
        type: 'object',
        properties: { ok: { type: 'boolean' } },
      },
      400: { $ref: 'Error#' },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [profile] = await db
    .select({ id: coachProfile.id })
    .from(coachProfile)
    .where(eq(coachProfile.userId, session.user.id))

  if (!profile) return reply.status(403).send({ error: 'Coach profile not found' })

  const slots = req.body as Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    slotDuration: number
    isActive: boolean
  }>

  if (!Array.isArray(slots)) {
    return reply.status(400).send({ error: 'Expected array of schedule slots' })
  }

  for (const slot of slots) {
    await db
      .insert(coachSchedule)
      .values({ coachId: profile.id, ...slot })
      .onConflictDoUpdate({
        target: [coachSchedule.coachId, coachSchedule.dayOfWeek],
        set: {
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.slotDuration,
          isActive: slot.isActive,
          updatedAt: new Date(),
        },
      })
  }

  return reply.send({ ok: true })
})

// Get available slots for a coach on a specific date
app.get('/api/coaches/:coachId/slots', {
  schema: {
    tags: ['Schedule'],
    summary: 'Вільні слоти тренера на дату',
    description: 'Повертає всі слоти дня з позначкою available. Вже заброньовані (не cancelled/refunded) позначені як зайняті.',
    security: [{ cookieAuth: [] }],
    params: {
      type: 'object',
      required: ['coachId'],
      properties: {
        coachId: { type: 'string', format: 'uuid', description: 'ID профілю тренера (coachProfile.id)' },
      },
    },
    querystring: {
      type: 'object',
      required: ['date'],
      properties: {
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Дата у форматі YYYY-MM-DD', example: '2026-03-28' },
      },
    },
    response: {
      200: {
        description: 'Список слотів',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            time: { type: 'string', example: '10:00', description: 'Час початку слота (UTC)' },
            available: { type: 'boolean' },
          },
        },
      },
      400: { $ref: 'Error#' },
      401: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const { coachId } = req.params as { coachId: string }
  const { date } = req.query as { date?: string }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return reply.status(400).send({ error: 'date query param required (YYYY-MM-DD)' })
  }

  const parsed = new Date(date)
  const jsDow = parsed.getDay()
  const dayOfWeek = jsDow === 0 ? 6 : jsDow - 1

  const [schedule] = await db
    .select()
    .from(coachSchedule)
    .where(and(
      eq(coachSchedule.coachId, coachId),
      eq(coachSchedule.dayOfWeek, dayOfWeek),
      eq(coachSchedule.isActive, true),
    ))

  if (!schedule) return reply.send([])

  const [startH, startM] = schedule.startTime.split(':').map(Number)
  const [endH, endM] = schedule.endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  const allSlots: string[] = []
  for (let m = startMinutes; m + schedule.slotDuration <= endMinutes; m += schedule.slotDuration) {
    const h = String(Math.floor(m / 60)).padStart(2, '0')
    const min = String(m % 60).padStart(2, '0')
    allSlots.push(`${h}:${min}`)
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`)
  const dayEnd = new Date(`${date}T23:59:59.999Z`)

  const booked = await db
    .select({ scheduledAt: booking.scheduledAt })
    .from(booking)
    .where(and(
      eq(booking.coachId, coachId),
      gte(booking.scheduledAt, dayStart),
      lt(booking.scheduledAt, dayEnd),
      ne(booking.status, 'cancelled'),
      ne(booking.status, 'refunded'),
    ))

  const bookedTimes = new Set(
    booked.map(b => {
      const d = new Date(b.scheduledAt)
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
    })
  )

  return reply.send(allSlots.map(time => ({ time, available: !bookedTimes.has(time) })))
})

// Student creates a booking
app.post('/api/bookings', {
  schema: {
    tags: ['Schedule'],
    summary: 'Забронювати слот у тренера',
    description: 'Учень бронює конкретний час. Перевіряється відсутність конфлікту. Статус стартує як pending.',
    security: [{ cookieAuth: [] }],
    body: {
      type: 'object',
      required: ['coachId', 'date', 'time'],
      properties: {
        coachId: { type: 'string', format: 'uuid', description: 'coachProfile.id тренера' },
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', example: '2026-03-28' },
        time: { type: 'string', pattern: '^[0-2]\\d:[0-5]\\d$', example: '10:00', description: 'Час у UTC' },
      },
    },
    response: {
      201: {
        description: 'Бронювання створено',
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['pending'] },
          scheduledAt: { type: 'string', format: 'date-time' },
        },
      },
      400: { $ref: 'Error#' },
      401: { $ref: 'Error#' },
      409: { description: 'Слот вже зайнятий', type: 'object', properties: { error: { type: 'string' } } },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const { coachId, date, time } = req.body as {
    coachId: string
    date: string
    time: string
  }

  if (!coachId || !date || !time) {
    return reply.status(400).send({ error: 'coachId, date and time are required' })
  }

  const scheduledAt = new Date(`${date}T${time}:00.000Z`)

  const slotEnd = new Date(scheduledAt.getTime() + 60 * 60 * 1000)
  const [conflict] = await db
    .select({ id: booking.id })
    .from(booking)
    .where(and(
      eq(booking.coachId, coachId),
      gte(booking.scheduledAt, scheduledAt),
      lt(booking.scheduledAt, slotEnd),
      ne(booking.status, 'cancelled'),
      ne(booking.status, 'refunded'),
    ))

  if (conflict) {
    return reply.status(409).send({ error: 'Slot already booked' })
  }

  const [created] = await db
    .insert(booking)
    .values({
      studentId: session.user.id,
      coachId,
      scheduledAt,
      price: '0',
    })
    .returning({ id: booking.id, status: booking.status, scheduledAt: booking.scheduledAt })

  return reply.status(201).send(created)
})

// Coach views their bookings
app.get('/api/coach/bookings', {
  schema: {
    tags: ['Schedule'],
    summary: 'Бронювання тренера',
    description: 'Всі бронювання поточного тренера, відсортовані за датою.',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'] },
            scheduledAt: { type: 'string', format: 'date-time' },
            durationMin: { type: 'integer' },
            notes: { type: 'string', nullable: true },
            cancelReason: { type: 'string', nullable: true },
            studentId: { type: 'string' },
            studentName: { type: 'string' },
            studentEmail: { type: 'string', format: 'email' },
          },
        },
      },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [profile] = await db
    .select({ id: coachProfile.id })
    .from(coachProfile)
    .where(eq(coachProfile.userId, session.user.id))

  if (!profile) return reply.status(403).send({ error: 'Coach profile not found' })

  const studentUser = alias(user, 'student_user')

  const rows = await db
    .select({
      id: booking.id,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      durationMin: booking.durationMin,
      notes: booking.notes,
      cancelReason: booking.cancelReason,
      studentId: booking.studentId,
      studentName: studentUser.name,
      studentEmail: studentUser.email,
    })
    .from(booking)
    .innerJoin(studentUser, eq(booking.studentId, studentUser.id))
    .where(eq(booking.coachId, profile.id))
    .orderBy(asc(booking.scheduledAt))

  return reply.send(rows)
})

// Coach confirms or cancels a booking
app.patch('/api/bookings/:id/status', {
  schema: {
    tags: ['Schedule'],
    summary: 'Змінити статус бронювання (тренер)',
    security: [{ cookieAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' },
      },
    },
    body: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['confirmed', 'completed', 'cancelled'] },
        cancelReason: { type: 'string', description: 'Причина скасування (опційно)' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string' },
        },
      },
      400: { $ref: 'Error#' },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
      404: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [profile] = await db
    .select({ id: coachProfile.id })
    .from(coachProfile)
    .where(eq(coachProfile.userId, session.user.id))

  if (!profile) return reply.status(403).send({ error: 'Coach profile not found' })

  const { id } = req.params as { id: string }
  const { status, cancelReason } = req.body as {
    status: 'confirmed' | 'completed' | 'cancelled'
    cancelReason?: string
  }

  const allowed = ['confirmed', 'completed', 'cancelled'] as const
  if (!allowed.includes(status)) {
    return reply.status(400).send({ error: 'Invalid status' })
  }

  const [b] = await db
    .select({ id: booking.id })
    .from(booking)
    .where(and(eq(booking.id, id), eq(booking.coachId, profile.id)))

  if (!b) return reply.status(404).send({ error: 'Booking not found' })

  const [updated] = await db
    .update(booking)
    .set({
      status,
      cancelReason: cancelReason ?? null,
      completedAt: status === 'completed' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(booking.id, id))
    .returning({ id: booking.id, status: booking.status })

  return reply.send(updated)
})

// ── Student ───────────────────────────────────────────────────────────────────

// Get own student profile
app.get('/api/student/profile', {
  schema: {
    tags: ['Student'],
    summary: 'Отримати профіль учня',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        nullable: true,
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string' },
          level: { type: 'string', nullable: true, enum: ['beginner', 'intermediate', 'advanced'] },
          fideRating: { type: 'integer', nullable: true },
          clubRating: { type: 'integer', nullable: true },
          chesscomUsername: { type: 'string', nullable: true },
          lichessUsername: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          birthdate: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      401: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [profile] = await db
    .select()
    .from(studentProfile)
    .where(eq(studentProfile.userId, session.user.id))

  return reply.send(profile ?? null)
})

// Create or update own student profile
app.put('/api/student/profile', {
  schema: {
    tags: ['Student'],
    summary: 'Створити або оновити профіль учня',
    security: [{ cookieAuth: [] }],
    body: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
        fideRating: { type: 'integer', minimum: 0, maximum: 3000 },
        clubRating: { type: 'integer', minimum: 0, maximum: 3000 },
        chesscomUsername: { type: 'string' },
        lichessUsername: { type: 'string' },
        bio: { type: 'string' },
        birthdate: { type: 'string', format: 'date', example: '2010-05-15' },
      },
    },
    response: {
      200: { description: 'Профіль оновлено', type: 'object' },
      201: { description: 'Профіль створено', type: 'object' },
      401: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const { level, fideRating, clubRating, chesscomUsername, lichessUsername, bio, birthdate } =
    req.body as {
      level?: string
      fideRating?: number
      clubRating?: number
      chesscomUsername?: string
      lichessUsername?: string
      bio?: string
      birthdate?: string
    }

  const values = {
    userId: session.user.id,
    level: (level || null) as typeof studentProfile.level._.data,
    fideRating: fideRating ?? null,
    clubRating: clubRating ?? null,
    chesscomUsername: chesscomUsername ?? null,
    lichessUsername: lichessUsername ?? null,
    bio: bio ?? null,
    birthdate: birthdate ? new Date(birthdate) : null,
  }

  const [existing] = await db
    .select({ id: studentProfile.id })
    .from(studentProfile)
    .where(eq(studentProfile.userId, session.user.id))

  if (existing) {
    const [updated] = await db
      .update(studentProfile)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(studentProfile.userId, session.user.id))
      .returning()
    return reply.send(updated)
  }

  const [created] = await db.insert(studentProfile).values(values).returning()
  return reply.status(201).send(created)
})

// Get own assigned coach
app.get('/api/student/coach', {
  schema: {
    tags: ['Student'],
    summary: 'Отримати свого тренера',
    description: 'Повертає тренера призначеного до учня через enrollment, або null.',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        nullable: true,
        type: 'object',
        properties: {
          enrollmentId: { type: 'string', format: 'uuid' },
          coachProfileId: { type: 'string', format: 'uuid' },
          coachName: { type: 'string' },
          coachEmail: { type: 'string', format: 'email' },
          bio: { type: 'string', nullable: true },
          title: { type: 'string', nullable: true },
          fideRating: { type: 'integer', nullable: true },
          avgRating: { type: 'string', nullable: true },
          totalReviews: { type: 'integer' },
          specializations: { type: 'array', items: { type: 'string' } },
        },
      },
      401: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const coachUser = alias(user, 'coach_user')

  const [row] = await db
    .select({
      enrollmentId: enrollment.id,
      coachProfileId: coachProfile.id,
      coachName: coachUser.name,
      coachEmail: coachUser.email,
      bio: coachProfile.bio,
      title: coachProfile.title,
      fideRating: coachProfile.fideRating,
      avgRating: coachProfile.avgRating,
      totalReviews: coachProfile.totalReviews,
      specializations: coachProfile.specializations,
    })
    .from(enrollment)
    .innerJoin(coachProfile, eq(enrollment.coachId, coachProfile.id))
    .innerJoin(coachUser, eq(coachProfile.userId, coachUser.id))
    .where(eq(enrollment.studentId, session.user.id))

  return reply.send(row ?? null)
})

// Student views their bookings
app.get('/api/student/bookings', {
  schema: {
    tags: ['Student'],
    summary: 'Заняття учня',
    description: 'Всі бронювання поточного учня, відсортовані за датою.',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'] },
            scheduledAt: { type: 'string', format: 'date-time' },
            durationMin: { type: 'integer' },
            notes: { type: 'string', nullable: true },
            cancelReason: { type: 'string', nullable: true },
            coachName: { type: 'string' },
            coachTitle: { type: 'string', nullable: true },
          },
        },
      },
      401: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const coachUser = alias(user, 'coach_user')

  const rows = await db
    .select({
      id: booking.id,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      durationMin: booking.durationMin,
      notes: booking.notes,
      cancelReason: booking.cancelReason,
      coachName: coachUser.name,
      coachTitle: coachProfile.title,
    })
    .from(booking)
    .innerJoin(coachProfile, eq(booking.coachId, coachProfile.id))
    .innerJoin(coachUser, eq(coachProfile.userId, coachUser.id))
    .where(eq(booking.studentId, session.user.id))
    .orderBy(asc(booking.scheduledAt))

  return reply.send(rows)
})

// Student cancels their own booking
app.patch('/api/student/bookings/:id/cancel', {
  schema: {
    tags: ['Student'],
    summary: 'Скасувати своє бронювання',
    security: [{ cookieAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['cancelled'] },
        },
      },
      401: { $ref: 'Error#' },
      404: { $ref: 'Error#' },
      409: { description: 'Вже скасовано', type: 'object', properties: { error: { type: 'string' } } },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const { id } = req.params as { id: string }

  const [b] = await db
    .select({ id: booking.id, status: booking.status })
    .from(booking)
    .where(and(eq(booking.id, id), eq(booking.studentId, session.user.id)))

  if (!b) return reply.status(404).send({ error: 'Booking not found' })
  if (b.status === 'cancelled') return reply.status(409).send({ error: 'Already cancelled' })

  const [updated] = await db
    .update(booking)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(booking.id, id))
    .returning({ id: booking.id, status: booking.status })

  return reply.send(updated)
})

// ── Admin ─────────────────────────────────────────────────────────────────────

// List pending users
app.get('/api/admin/pending', {
  schema: {
    tags: ['Admin'],
    summary: 'Список користувачів на розгляді',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const pending = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  }).from(user).where(eq(user.status, 'pending'))

  return reply.send(pending)
})

// Approve user
app.patch('/api/admin/users/:id/approve', {
  schema: {
    tags: ['Admin'],
    summary: 'Підтвердити заявку користувача',
    security: [{ cookieAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', description: 'User ID' } },
    },
    response: {
      200: { type: 'object', properties: { ok: { type: 'boolean' } } },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const { id } = req.params as { id: string }
  await db.update(user).set({ status: 'active' }).where(eq(user.id, id))
  return reply.send({ ok: true })
})

// Reject user
app.patch('/api/admin/users/:id/reject', {
  schema: {
    tags: ['Admin'],
    summary: 'Відхилити заявку тренера (повернути роль student)',
    security: [{ cookieAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', description: 'User ID' } },
    },
    response: {
      200: { type: 'object', properties: { ok: { type: 'boolean' } } },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const { id } = req.params as { id: string }
  await db.update(user).set({ role: 'student', status: 'active' }).where(eq(user.id, id))
  return reply.send({ ok: true })
})

// List all users
app.get('/api/admin/users', {
  schema: {
    tags: ['Admin'],
    summary: 'Список всіх користувачів',
    security: [{ cookieAuth: [] }],
    querystring: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: ['student', 'parent', 'coach', 'school_owner', 'admin', 'super_admin'], description: 'Фільтр по ролі' },
      },
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string' },
            status: { type: 'string' },
            plan: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const { role } = req.query as { role?: string }

  const query = db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    plan: user.plan,
    createdAt: user.createdAt,
  }).from(user).orderBy(asc(user.createdAt))

  const users = role
    ? await query.where(eq(user.role, role as typeof user.role._.data))
    : await query

  return reply.send(users)
})

// Admin stats
app.get('/api/admin/stats', {
  schema: {
    tags: ['Admin'],
    summary: 'Статистика дашборду',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          totalUsers: { type: 'integer' },
          pendingCount: { type: 'integer' },
          enrollmentsCount: { type: 'integer' },
        },
      },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(user)
  const [pendingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(user).where(eq(user.status, 'pending'))
  const [enrollmentsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollment)

  return reply.send({
    totalUsers: totalUsers.count,
    pendingCount: pendingCount.count,
    enrollmentsCount: enrollmentsCount.count,
  })
})

// ── Enrollments ───────────────────────────────────────────────────────────────

// List coaches for dropdown
app.get('/api/admin/coaches', {
  schema: {
    tags: ['Enrollments'],
    summary: 'Список тренерів для призначення',
    description: 'Повертає тренерів, що мають профіль. Використовується в дропдауні призначення.',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            coachProfileId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
      },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const coachUser = alias(user, 'coach_user')

  const rows = await db
    .select({
      coachProfileId: coachProfile.id,
      name: coachUser.name,
      email: coachUser.email,
    })
    .from(coachProfile)
    .innerJoin(coachUser, eq(coachProfile.userId, coachUser.id))
    .orderBy(asc(coachUser.name))

  return reply.send(rows)
})

// List all enrollments
app.get('/api/admin/enrollments', {
  schema: {
    tags: ['Enrollments'],
    summary: 'Список всіх призначень учень → тренер',
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            studentId: { type: 'string' },
            studentName: { type: 'string' },
            studentEmail: { type: 'string', format: 'email' },
            coachId: { type: 'string', format: 'uuid' },
            coachName: { type: 'string' },
          },
        },
      },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const studentUser = alias(user, 'student_user')
  const coachUser = alias(user, 'coach_user')

  const rows = await db
    .select({
      id: enrollment.id,
      notes: enrollment.notes,
      createdAt: enrollment.createdAt,
      studentId: enrollment.studentId,
      studentName: studentUser.name,
      studentEmail: studentUser.email,
      coachId: enrollment.coachId,
      coachName: coachUser.name,
    })
    .from(enrollment)
    .innerJoin(studentUser, eq(enrollment.studentId, studentUser.id))
    .innerJoin(coachProfile, eq(enrollment.coachId, coachProfile.id))
    .innerJoin(coachUser, eq(coachProfile.userId, coachUser.id))
    .orderBy(asc(enrollment.createdAt))

  return reply.send(rows)
})

// Assign student to coach
app.post('/api/admin/enrollments', {
  schema: {
    tags: ['Enrollments'],
    summary: 'Призначити учня до тренера',
    security: [{ cookieAuth: [] }],
    body: {
      type: 'object',
      required: ['studentId', 'coachId'],
      properties: {
        studentId: { type: 'string', description: 'User ID учня' },
        coachId: { type: 'string', format: 'uuid', description: 'coachProfile.id тренера' },
        notes: { type: 'string', description: 'Примітка адміна' },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      400: { $ref: 'Error#' },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
      409: { description: 'Призначення вже існує', type: 'object', properties: { error: { type: 'string' } } },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const { studentId, coachId, notes } = req.body as { studentId: string; coachId: string; notes?: string }

  if (!studentId || !coachId) {
    return reply.status(400).send({ error: 'studentId and coachId are required' })
  }

  const [existing] = await db
    .select({ id: enrollment.id })
    .from(enrollment)
    .where(and(eq(enrollment.studentId, studentId), eq(enrollment.coachId, coachId)))

  if (existing) {
    return reply.status(409).send({ error: 'Enrollment already exists' })
  }

  const [created] = await db
    .insert(enrollment)
    .values({ studentId, coachId, assignedBy: session.user.id, notes })
    .returning({ id: enrollment.id })

  return reply.status(201).send(created)
})

// Remove enrollment
app.delete('/api/admin/enrollments/:id', {
  schema: {
    tags: ['Enrollments'],
    summary: 'Видалити призначення',
    security: [{ cookieAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', format: 'uuid' } },
    },
    response: {
      200: { type: 'object', properties: { ok: { type: 'boolean' } } },
      401: { $ref: 'Error#' },
      403: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const { id } = req.params as { id: string }
  await db.delete(enrollment).where(eq(enrollment.id, id))
  return reply.send({ ok: true })
})

// ── Public ────────────────────────────────────────────────────────────────────

// Save lead
app.post('/api/leads', {
  schema: {
    tags: ['Public'],
    summary: 'Залишити заявку (публічна форма)',
    security: [],
    body: {
      type: 'object',
      required: ['name', 'contact'],
      properties: {
        name: { type: 'string', description: 'Ім\'я' },
        contact: { type: 'string', description: 'Телефон або email' },
        comment: { type: 'string', description: 'Коментар' },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      400: { $ref: 'Error#' },
    },
  },
}, async (req, reply) => {
  const { name, contact, comment } = req.body as { name: string; contact: string; comment?: string }
  if (!name || !contact) {
    return reply.status(400).send({ error: 'name and contact are required' })
  }
  const [created] = await db.insert(lead).values({ name, contact, comment }).returning({ id: lead.id })
  return reply.status(201).send(created)
})

// Health check
app.get('/health', {
  schema: {
    tags: ['Public'],
    summary: 'Health check',
    security: [],
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          db: { type: 'string' },
        },
      },
    },
  },
}, async () => {
  await db.execute(sql`SELECT 1`)
  return { status: 'ok', db: 'connected' }
})

try {
  await migrate(db, { migrationsFolder: './drizzle' })
  await app.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.stderr.write('STARTUP ERROR: ' + String(err) + '\n')
  process.exit(1)
}
