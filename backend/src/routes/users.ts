import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { user } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth.js'
import { sendWelcome } from '../email.js'
import { SELF_ASSIGNABLE_ROLES, ROLES, type Role } from '../lib/constants.js'

export default async function usersRoutes(app: FastifyInstance) {
  app.patch('/api/users/me/role', {
    preHandler: [requireAuth],
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
    const { role, phone, contactMethod, instagram } = req.body as {
      role: string
      phone?: string
      contactMethod?: string
      instagram?: string
    }

    if (!(SELF_ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
      return reply.status(400).send({ error: 'Invalid role' })
    }

    // SEC-06: prevent role change after initial assignment
    const [currentUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, req.session.user.id))

    if (currentUser && currentUser.role !== ROLES.STUDENT) {
      return reply.status(400).send({ error: 'Role already assigned' })
    }

    const status = role === ROLES.COACH ? 'pending' : 'active'
    await db.update(user).set({
      role: role as Role,
      status,
      phone: phone ?? null,
      contactMethod: contactMethod ?? null,
      instagram: instagram ?? null,
    }).where(eq(user.id, req.session.user.id))

    sendWelcome(req.session.user.email, req.session.user.name).catch(() => {})

    return reply.send({ ok: true, status })
  })

  app.get('/api/users/me', {
    preHandler: [requireAuth],
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
            phone: { type: 'string', nullable: true },
            contactMethod: { type: 'string', nullable: true },
            instagram: { type: 'string', nullable: true },
          },
        },
        401: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const [u] = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      plan: user.plan,
      phone: user.phone,
      contactMethod: user.contactMethod,
      instagram: user.instagram,
    }).from(user).where(eq(user.id, req.session.user.id))

    return reply.send(u)
  })
}
