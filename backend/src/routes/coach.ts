import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { user, coachProfile, coachSchedule, enrollment, studentProfile } from '../db/schema.js'
import { eq, and, asc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { requireAuth } from '../middleware/auth.js'
import { getCoachProfile } from '../lib/profile.js'

export default async function coachRoutes(app: FastifyInstance) {
  app.get('/api/coach/profile', {
    preHandler: [requireAuth],
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
    const [profile] = await db
      .select()
      .from(coachProfile)
      .where(eq(coachProfile.userId, req.session.user.id))

    return reply.send(profile ?? null)
  })

  app.put('/api/coach/profile', {
    preHandler: [requireAuth],
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
    const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, req.session.user.id))
    if (!me || me.role !== 'coach') {
      return reply.status(403).send({ error: 'Only coaches can update coach profile' })
    }

    const { bio, title, fideRating, hourlyRate, languages, specializations } = req.body as {
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
      userId: req.session.user.id,
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
      .where(eq(coachProfile.userId, req.session.user.id))

    if (existing) {
      const [updated] = await db
        .update(coachProfile)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(coachProfile.userId, req.session.user.id))
        .returning()
      return reply.send(updated)
    }

    const [created] = await db.insert(coachProfile).values(values).returning()
    return reply.status(201).send(created)
  })

  app.get('/api/coach/students', {
    preHandler: [requireAuth],
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
    const profile = await getCoachProfile(req.session.user.id)
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

  app.get('/api/coach/schedule', {
    preHandler: [requireAuth],
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
    const profile = await getCoachProfile(req.session.user.id)
    if (!profile) return reply.status(403).send({ error: 'Coach profile not found' })

    const rows = await db
      .select()
      .from(coachSchedule)
      .where(eq(coachSchedule.coachId, profile.id))
      .orderBy(asc(coachSchedule.dayOfWeek))

    return reply.send(rows)
  })

  app.put('/api/coach/schedule', {
    preHandler: [requireAuth],
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
    const profile = await getCoachProfile(req.session.user.id)
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
}
