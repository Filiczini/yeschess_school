import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { user, coachProfile, coachSchedule, booking } from '../db/schema.js'
import { eq, and, gte, lt, ne, asc, sql, inArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { requireAuth } from '../middleware/auth.js'
import { getCoachProfile } from '../lib/profile.js'
import { sendBookingConfirmed, sendBookingCancelled } from '../email.js'

export default async function bookingsRoutes(app: FastifyInstance) {
  app.get('/api/coaches/:coachId/slots', {
    preHandler: [requireAuth],
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

  app.post('/api/bookings', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Schedule'],
      summary: 'Забронювати слот у тренера',
      description: 'Учень бронює конкретний час. Статус стартує як pending.',
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
    const { coachId, date, time } = req.body as { coachId: string; date: string; time: string }

    if (!coachId || !date || !time) {
      return reply.status(400).send({ error: 'coachId, date and time are required' })
    }

    const scheduledAt = new Date(`${date}T${time}:00.000Z`)

    try {
      const [created] = await db
        .insert(booking)
        .values({ studentId: req.session.user.id, coachId, scheduledAt, price: '0' })
        .returning({ id: booking.id, status: booking.status, scheduledAt: booking.scheduledAt })

      return reply.status(201).send(created)
    } catch (err: any) {
      if (err.code === '23505') {
        return reply.status(409).send({ error: 'Slot already booked' })
      }
      throw err
    }
  })

  app.get('/api/coach/bookings', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Schedule'],
      summary: 'Бронювання тренера',
      description: 'Бронювання поточного тренера з фільтром по статусу та пагінацією.',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
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
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' },
              },
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

    const { status, page: rawPage, limit: rawLimit } = req.query as {
      status?: string; page?: number; limit?: number
    }
    const page = Math.max(1, rawPage ?? 1)
    const limit = Math.min(100, Math.max(1, rawLimit ?? 20))
    const offset = (page - 1) * limit

    const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'] as const
    type BookingStatus = typeof BOOKING_STATUSES[number]
    const validStatus = BOOKING_STATUSES.includes(status as BookingStatus) ? status as BookingStatus : undefined

    const studentUser = alias(user, 'student_user')
    const filter = and(
      eq(booking.coachId, profile.id),
      validStatus ? eq(booking.status, validStatus) : undefined,
    )

    const [[{ total }], data] = await Promise.all([
      db.select({ total: sql<number>`count(*)::int` }).from(booking).where(filter),
      db.select({
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
        .where(filter)
        .orderBy(asc(booking.scheduledAt))
        .limit(limit)
        .offset(offset),
    ])

    return reply.send({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
  })

  app.patch('/api/bookings/:id/status', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Schedule'],
      summary: 'Змінити статус бронювання (тренер)',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
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
        200: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, status: { type: 'string' } } },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
        404: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const profile = await getCoachProfile(req.session.user.id)
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

    const [bookingFull] = await db
      .select({ scheduledAt: booking.scheduledAt, durationMin: booking.durationMin, studentId: booking.studentId })
      .from(booking)
      .where(eq(booking.id, id))

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

    if (bookingFull && (status === 'confirmed' || status === 'cancelled')) {
      const coachUserAlias = alias(user, 'coach_user_email')
      const [studentRow] = await db
        .select({ name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, bookingFull.studentId))
      const [coachRow] = await db
        .select({ name: coachUserAlias.name })
        .from(coachProfile)
        .innerJoin(coachUserAlias, eq(coachProfile.userId, coachUserAlias.id))
        .where(eq(coachProfile.id, profile.id))
      if (studentRow && coachRow) {
        if (status === 'confirmed') {
          sendBookingConfirmed(
            studentRow.email, studentRow.name, coachRow.name,
            bookingFull.scheduledAt, bookingFull.durationMin,
          ).catch(() => {})
        } else {
          sendBookingCancelled(
            studentRow.email, studentRow.name, coachRow.name,
            bookingFull.scheduledAt, cancelReason,
          ).catch(() => {})
        }
      }
    }

    return reply.send(updated)
  })
}
