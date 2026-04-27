import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { user, coachProfile, booking } from '../db/schema.js'
import { eq, and, asc, sql, inArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { requireAuth } from '../middleware/auth.js'
import { getCoachProfile } from '../lib/profile.js'
import { getAvailableSlots } from '../services/slot-validation.js'
import { notifyBookingStatusChange } from '../services/booking-notifications.js'

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

    const slots = await getAvailableSlots(db, { coachId, date })
    return reply.send(slots)
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
      await notifyBookingStatusChange(db, {
        status,
        studentId: bookingFull.studentId,
        coachProfileId: profile.id,
        scheduledAt: bookingFull.scheduledAt,
        durationMin: bookingFull.durationMin,
        cancelReason,
      }).catch(() => {})
    }

    return reply.send(updated)
  })
}
