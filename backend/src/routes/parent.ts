import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { user, parentChild, linkCode, coachProfile, enrollment, booking, studentProfile } from '../db/schema.js'
import { eq, and, gte, ne, inArray, asc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { requireAuth } from '../middleware/auth.js'
import { auth } from '../auth.js'

export default async function parentRoutes(app: FastifyInstance) {
  app.patch('/api/parent/profile', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Parent'],
      summary: 'Оновити контактну інформацію батька',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          contactMethod: { type: 'string' },
          instagram: { type: 'string' },
        },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, req.session.user.id))
    if (!me || me.role !== 'parent') return reply.status(403).send({ error: 'Forbidden' })

    const { name, phone, contactMethod, instagram } = req.body as {
      name?: string; phone?: string; contactMethod?: string; instagram?: string
    }

    await db.update(user).set({
      ...(name !== undefined && { name }),
      phone: phone ?? null,
      contactMethod: contactMethod ?? null,
      instagram: instagram ?? null,
      updatedAt: new Date(),
    }).where(eq(user.id, req.session.user.id))

    return reply.send({ ok: true })
  })

  app.post('/api/parent/link-child', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Parent'],
      summary: 'Прив\'язати існуючого учня за кодом',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['code'],
        properties: { code: { type: 'string' } },
      },
      response: {
        200: { type: 'object', properties: { childId: { type: 'string' }, childName: { type: 'string' } } },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
        404: { $ref: 'Error#' },
        409: { description: 'Вже прив\'язано', type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, req.session.user.id))
    if (!me || me.role !== 'parent') return reply.status(403).send({ error: 'Тільки для батьків' })

    const { code } = req.body as { code: string }

    const [row] = await db
      .select({ studentId: linkCode.studentId, expiresAt: linkCode.expiresAt, name: user.name })
      .from(linkCode)
      .innerJoin(user, eq(linkCode.studentId, user.id))
      .where(eq(linkCode.code, code.toUpperCase().trim()))

    if (!row) return reply.status(404).send({ error: 'Код не знайдено' })
    if (row.expiresAt < new Date()) return reply.status(400).send({ error: 'Код прострочений' })

    const [existing] = await db
      .select({ id: parentChild.id })
      .from(parentChild)
      .where(and(eq(parentChild.parentId, req.session.user.id), eq(parentChild.childId, row.studentId)))

    if (existing) return reply.status(409).send({ error: 'Дитину вже прив\'язано до вашого акаунту' })

    await db.insert(parentChild).values({ parentId: req.session.user.id, childId: row.studentId })
    await db.delete(linkCode).where(eq(linkCode.code, code.toUpperCase().trim()))

    return reply.send({ childId: row.studentId, childName: row.name })
  })

  app.get('/api/parent/children', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Parent'],
      summary: 'Список дітей батька',
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
              level: { type: 'string', nullable: true, enum: ['beginner', 'intermediate', 'advanced'] },
              fideRating: { type: 'integer', nullable: true },
              clubRating: { type: 'integer', nullable: true },
              coachName: { type: 'string', nullable: true },
              coachTitle: { type: 'string', nullable: true },
              upcomingBookings: { type: 'integer' },
            },
          },
        },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, req.session.user.id))
    if (!me || me.role !== 'parent') return reply.status(403).send({ error: 'Forbidden' })

    const childUser = alias(user, 'child_user')
    const coachUser = alias(user, 'coach_user')

    const rows = await db
      .select({
        id: childUser.id,
        name: childUser.name,
        email: childUser.email,
        level: studentProfile.level,
        fideRating: studentProfile.fideRating,
        clubRating: studentProfile.clubRating,
        coachName: coachUser.name,
        coachTitle: coachProfile.title,
      })
      .from(parentChild)
      .innerJoin(childUser, eq(parentChild.childId, childUser.id))
      .leftJoin(studentProfile, eq(studentProfile.userId, childUser.id))
      .leftJoin(enrollment, eq(enrollment.studentId, childUser.id))
      .leftJoin(coachProfile, eq(coachProfile.id, enrollment.coachId))
      .leftJoin(coachUser, eq(coachProfile.userId, coachUser.id))
      .where(eq(parentChild.parentId, req.session.user.id))

    if (rows.length === 0) return reply.send([])

    const childIds = rows.map(r => r.id)
    const now = new Date()
    const bookingCounts = await db
      .select({ studentId: booking.studentId, count: sql<number>`count(*)::int` })
      .from(booking)
      .where(and(inArray(booking.studentId, childIds), gte(booking.scheduledAt, now), ne(booking.status, 'cancelled')))
      .groupBy(booking.studentId)

    const countMap = Object.fromEntries(bookingCounts.map(b => [b.studentId, b.count]))

    return reply.send(rows.map(r => ({ ...r, upcomingBookings: countMap[r.id] ?? 0 })))
  })

  app.post('/api/parent/children', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Parent'],
      summary: 'Додати дитину',
      description: 'Створює акаунт учня та прив\'язує його до батьківського акаунту.',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'email', 'password', 'level'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          birthdate: { type: 'string', format: 'date', description: 'YYYY-MM-DD' },
        },
      },
      response: {
        201: { type: 'object', properties: { id: { type: 'string' } } },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
        409: { description: 'Email вже використовується', type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, req.session.user.id))
    if (!me || me.role !== 'parent') return reply.status(403).send({ error: 'Forbidden' })

    const { name, email, password, level, birthdate } = req.body as {
      name: string; email: string; password: string; level: string; birthdate?: string
    }

    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email))
    if (existing) return reply.status(409).send({ error: 'Email вже використовується' })

    const signUpResult = await auth.api.signUpEmail({
      body: { email, password, name },
      headers: new Headers(),
    })

    const childId = signUpResult.user.id

    await db.update(user)
      .set({ role: 'student', status: 'active', updatedAt: new Date() })
      .where(eq(user.id, childId))

    await db.insert(studentProfile).values({
      userId: childId,
      level: level as typeof studentProfile.level._.data,
      birthdate: birthdate ? new Date(birthdate) : null,
    })

    await db.insert(parentChild).values({ parentId: req.session.user.id, childId })

    return reply.status(201).send({ id: childId })
  })
}
