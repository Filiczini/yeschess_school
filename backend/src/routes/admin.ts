import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { user, coachProfile, enrollment, parentChild, linkCode, booking, account, session as sessionTable, studentProfile } from '../db/schema.js'
import { eq, and, asc, isNull, isNotNull, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { sendCoachAssigned } from '../email.js'
import { ADMIN_ROLES, ROLES } from '../lib/constants.js'

export default async function adminRoutes(app: FastifyInstance) {
  app.get('/api/admin/pending', {
    preHandler: [requireAuth, requireRole(...ADMIN_ROLES)],
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

  app.patch('/api/admin/users/:id/approve', {
    preHandler: [requireAuth, requireRole(...ADMIN_ROLES)],
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
    const { id } = req.params as { id: string }
    await db.update(user).set({ status: 'active' }).where(eq(user.id, id))
    return reply.send({ ok: true })
  })

  app.patch('/api/admin/users/:id/reject', {
    preHandler: [requireAuth, requireRole(...ADMIN_ROLES)],
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
    const { id } = req.params as { id: string }
    await db.update(user).set({ role: ROLES.STUDENT, status: 'active' }).where(eq(user.id, id))
    return reply.send({ ok: true })
  })

  app.get('/api/admin/users', {
    preHandler: [requireAuth, requireRole(...ADMIN_ROLES)],
    schema: {
      tags: ['Admin'],
      summary: 'Список всіх користувачів',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['student', 'parent', 'coach', 'school_owner', 'admin', 'super_admin'] },
          deleted: { type: 'boolean' },
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
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string' },
                  status: { type: 'string' },
                  plan: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  deletedAt: { type: 'string', format: 'date-time', nullable: true },
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
    const { role, deleted, page: rawPage, limit: rawLimit } = req.query as {
      role?: string; deleted?: boolean; page?: number; limit?: number
    }
    const page = Math.max(1, rawPage ?? 1)
    const limit = Math.min(100, Math.max(1, rawLimit ?? 20))
    const offset = (page - 1) * limit

    const baseFilter = deleted ? isNotNull(user.deletedAt) : isNull(user.deletedAt)
    const filter = role ? and(baseFilter, eq(user.role, role as typeof user.role._.data)) : baseFilter

    const [[{ total }], data] = await Promise.all([
      db.select({ total: sql<number>`count(*)::int` }).from(user).where(filter),
      db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        plan: user.plan,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
      }).from(user).where(filter).orderBy(asc(user.createdAt)).limit(limit).offset(offset),
    ])

    return reply.send({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
  })

  app.get('/api/admin/stats', {
    preHandler: [requireAuth, requireRole(...ADMIN_ROLES)],
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
    const [[totalUsers], [pendingCount], [enrollmentsCount]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(user),
      db.select({ count: sql<number>`count(*)::int` }).from(user).where(eq(user.status, 'pending')),
      db.select({ count: sql<number>`count(*)::int` }).from(enrollment),
    ])

    return reply.send({
      totalUsers: totalUsers.count,
      pendingCount: pendingCount.count,
      enrollmentsCount: enrollmentsCount.count,
    })
  })

  app.delete('/api/admin/users/:id', {
    preHandler: [requireAuth, requireRole('super_admin')],
    schema: {
      tags: ['Admin'],
      summary: 'М\'яке видалення користувача',
      description: 'Тільки super_admin. Ставить deletedAt — можна відновити через PATCH restore.',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'User ID' } },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
        404: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    if (id === req.session.user.id) return reply.status(400).send({ error: 'Не можна видалити себе' })

    const [target] = await db.select({ role: user.role, deletedAt: user.deletedAt }).from(user).where(eq(user.id, id))
    if (!target) return reply.status(404).send({ error: 'Користувача не знайдено' })
    if (target.role === ROLES.SUPER_ADMIN) return reply.status(400).send({ error: 'Не можна видалити super_admin' })
    if (target.deletedAt) return reply.status(400).send({ error: 'Вже видалено' })

    await db.update(user)
      .set({ deletedAt: new Date(), status: 'suspended', updatedAt: new Date() })
      .where(eq(user.id, id))

    return reply.send({ ok: true })
  })

  app.patch('/api/admin/users/:id/restore', {
    preHandler: [requireAuth, requireRole('super_admin')],
    schema: {
      tags: ['Admin'],
      summary: 'Відновити видаленого користувача',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'User ID' } },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
        404: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const [target] = await db.select({ deletedAt: user.deletedAt }).from(user).where(eq(user.id, id))
    if (!target) return reply.status(404).send({ error: 'Користувача не знайдено' })
    if (!target.deletedAt) return reply.status(400).send({ error: 'Користувач не видалений' })

    await db.update(user)
      .set({ deletedAt: null, status: 'active', updatedAt: new Date() })
      .where(eq(user.id, id))

    return reply.send({ ok: true })
  })

  app.delete('/api/admin/users/permanent', {
    preHandler: [requireAuth, requireRole('super_admin')],
    schema: {
      tags: ['Admin'],
      summary: 'Остаточне видалення користувачів',
      description: 'Тільки super_admin. Видаляє вже м\'яко-видалених користувачів назавжди.',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['ids'],
        properties: { ids: { type: 'array', items: { type: 'string' } } },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' }, deleted: { type: 'number' } } },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const { ids } = req.body as { ids: string[] }
    if (!ids.length) return reply.status(400).send({ error: 'Немає ID для видалення' })

    const targets = await db.select({ id: user.id, role: user.role, deletedAt: user.deletedAt })
      .from(user)
      .where(inArray(user.id, ids))

    const eligible = targets.filter(t => t.deletedAt !== null && t.role !== 'super_admin' && t.id !== req.session.user.id)
    if (!eligible.length) return reply.status(400).send({ error: 'Немає допустимих користувачів для видалення' })

    const eligibleIds = eligible.map(t => t.id)

    await db.transaction(async tx => {
      await tx.delete(parentChild).where(inArray(parentChild.parentId, eligibleIds))
      await tx.delete(parentChild).where(inArray(parentChild.childId, eligibleIds))
      await tx.delete(linkCode).where(inArray(linkCode.studentId, eligibleIds))
      await tx.delete(booking).where(inArray(booking.studentId, eligibleIds))
      await tx.delete(enrollment).where(inArray(enrollment.studentId, eligibleIds))
      await tx.delete(studentProfile).where(inArray(studentProfile.userId, eligibleIds))
      await tx.delete(coachProfile).where(inArray(coachProfile.userId, eligibleIds))
      await tx.delete(account).where(inArray(account.userId, eligibleIds))
      await tx.delete(sessionTable).where(inArray(sessionTable.userId, eligibleIds))
      await tx.delete(user).where(inArray(user.id, eligibleIds))
    })

    return reply.send({ ok: true, deleted: eligibleIds.length })
  })

  app.get('/api/admin/coaches', {
    preHandler: [requireAuth, requireRole(...ADMIN_ROLES)],
    schema: {
      tags: ['Enrollments'],
      summary: 'Список тренерів для призначення',
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
    const coachUser = alias(user, 'coach_user')

    const rows = await db
      .select({ coachProfileId: coachProfile.id, name: coachUser.name, email: coachUser.email })
      .from(coachProfile)
      .innerJoin(coachUser, eq(coachProfile.userId, coachUser.id))
      .orderBy(asc(coachUser.name))

    return reply.send(rows)
  })

  app.get('/api/admin/enrollments', {
    preHandler: [requireAuth, requireRole(...ADMIN_ROLES)],
    schema: {
      tags: ['Enrollments'],
      summary: 'Список всіх призначень учень → тренер',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
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
    const { page: rawPage, limit: rawLimit } = req.query as { page?: number; limit?: number }
    const page = Math.max(1, rawPage ?? 1)
    const limit = Math.min(100, Math.max(1, rawLimit ?? 20))
    const offset = (page - 1) * limit

    const studentUser = alias(user, 'student_user')
    const coachUser = alias(user, 'coach_user')

    const baseQuery = db
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

    const [[{ total }], data] = await Promise.all([
      db.select({ total: sql<number>`count(*)::int` })
        .from(enrollment)
        .innerJoin(studentUser, eq(enrollment.studentId, studentUser.id))
        .innerJoin(coachProfile, eq(enrollment.coachId, coachProfile.id))
        .innerJoin(coachUser, eq(coachProfile.userId, coachUser.id)),
      baseQuery.orderBy(asc(enrollment.createdAt)).limit(limit).offset(offset),
    ])

    return reply.send({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
  })

  app.post('/api/admin/enrollments', {
    preHandler: [requireAuth, requireRole(...ADMIN_ROLES)],
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
        201: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
        409: { description: 'Призначення вже існує', type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const { studentId, coachId, notes } = req.body as { studentId: string; coachId: string; notes?: string }

    if (!studentId || !coachId) {
      return reply.status(400).send({ error: 'studentId and coachId are required' })
    }

    const [existing] = await db
      .select({ id: enrollment.id })
      .from(enrollment)
      .where(and(eq(enrollment.studentId, studentId), eq(enrollment.coachId, coachId)))

    if (existing) return reply.status(409).send({ error: 'Enrollment already exists' })

    const [created] = await db
      .insert(enrollment)
      .values({ studentId, coachId, assignedBy: req.session.user.id, notes })
      .returning({ id: enrollment.id })

    const coachUserAlias = alias(user, 'coach_user_email')
    const [studentRow] = await db
      .select({ name: user.name, email: user.email })
      .from(user).where(eq(user.id, studentId))
    const [coachRow] = await db
      .select({ name: coachUserAlias.name, email: coachUserAlias.email })
      .from(coachProfile)
      .innerJoin(coachUserAlias, eq(coachProfile.userId, coachUserAlias.id))
      .where(eq(coachProfile.id, coachId))
    if (studentRow && coachRow) {
      sendCoachAssigned(studentRow.email, studentRow.name, coachRow.name, coachRow.email).catch(() => {})
    }

    return reply.status(201).send(created)
  })

  app.delete('/api/admin/enrollments/:id', {
    preHandler: [requireAuth, requireRole(...ADMIN_ROLES)],
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
    const { id } = req.params as { id: string }
    await db.delete(enrollment).where(eq(enrollment.id, id))
    return reply.send({ ok: true })
  })
}
