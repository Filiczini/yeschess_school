import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { user, studentProfile, enrollment, coachProfile, booking, parentChild, linkCode } from '../db/schema.js'
import { eq, and, asc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { randomBytes } from 'node:crypto'
import { requireAuth } from '../middleware/auth.js'

export default async function studentRoutes(app: FastifyInstance) {
  app.get('/api/student/profile', {
    preHandler: [requireAuth],
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
    const [profile] = await db
      .select()
      .from(studentProfile)
      .where(eq(studentProfile.userId, req.session.user.id))

    return reply.send(profile ?? null)
  })

  app.put('/api/student/profile', {
    preHandler: [requireAuth],
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
    const { level, fideRating, clubRating, chesscomUsername, lichessUsername, bio, birthdate } = req.body as {
      level?: string
      fideRating?: number
      clubRating?: number
      chesscomUsername?: string
      lichessUsername?: string
      bio?: string
      birthdate?: string
    }

    const values = {
      userId: req.session.user.id,
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
      .where(eq(studentProfile.userId, req.session.user.id))

    if (existing) {
      const [updated] = await db
        .update(studentProfile)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(studentProfile.userId, req.session.user.id))
        .returning()
      return reply.send(updated)
    }

    const [created] = await db.insert(studentProfile).values(values).returning()
    return reply.status(201).send(created)
  })

  app.get('/api/student/coach', {
    preHandler: [requireAuth],
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
      .where(eq(enrollment.studentId, req.session.user.id))

    return reply.send(row ?? null)
  })

  app.get('/api/student/bookings', {
    preHandler: [requireAuth],
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
      .where(eq(booking.studentId, req.session.user.id))
      .orderBy(asc(booking.scheduledAt))

    return reply.send(rows)
  })

  app.get('/api/student/parent', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Student'],
      summary: 'Отримати батька/матір учня',
      security: [{ cookieAuth: [] }],
      response: {
        200: {
          nullable: true,
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            contactMethod: { type: 'string', nullable: true },
          },
        },
        401: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const parentUser = alias(user, 'parent_user')

    const [row] = await db
      .select({
        id: parentUser.id,
        name: parentUser.name,
        email: parentUser.email,
        phone: parentUser.phone,
        contactMethod: parentUser.contactMethod,
      })
      .from(parentChild)
      .innerJoin(parentUser, eq(parentChild.parentId, parentUser.id))
      .where(eq(parentChild.childId, req.session.user.id))

    return reply.send(row ?? null)
  })

  app.patch('/api/student/bookings/:id/cancel', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Student'],
      summary: 'Скасувати своє бронювання',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        200: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, status: { type: 'string', enum: ['cancelled'] } } },
        401: { $ref: 'Error#' },
        404: { $ref: 'Error#' },
        409: { description: 'Вже скасовано', type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const [b] = await db
      .select({ id: booking.id, status: booking.status })
      .from(booking)
      .where(and(eq(booking.id, id), eq(booking.studentId, req.session.user.id)))

    if (!b) return reply.status(404).send({ error: 'Booking not found' })
    if (b.status === 'cancelled') return reply.status(409).send({ error: 'Already cancelled' })

    const [updated] = await db
      .update(booking)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(booking.id, id))
      .returning({ id: booking.id, status: booking.status })

    return reply.send(updated)
  })

  app.post('/api/student/link-code', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Student'],
      summary: 'Згенерувати код прив\'язки до батька',
      description: 'Повертає 10-символьний код, дійсний 24 години. Старі коди для цього учня видаляються.',
      security: [{ cookieAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'A3KX9MNP2Q' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, req.session.user.id))
    if (!me || me.role !== 'student') return reply.status(403).send({ error: 'Тільки для учнів' })

    await db.delete(linkCode).where(eq(linkCode.studentId, req.session.user.id))

    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const bytes = randomBytes(10)
    const code = Array.from(bytes).map(b => alphabet[b % alphabet.length]).join('')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db.insert(linkCode).values({ code, studentId: req.session.user.id, expiresAt })

    return reply.send({ code, expiresAt })
  })
}
