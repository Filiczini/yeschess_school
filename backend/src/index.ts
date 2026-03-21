import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { db } from './db/index.js'
import { user } from './db/schema.js'
import { eq, sql, asc } from 'drizzle-orm'
import { auth } from './auth.js'

const SELF_ASSIGNABLE_ROLES = ['student', 'parent', 'coach'] as const
type SelfAssignableRole = typeof SELF_ASSIGNABLE_ROLES[number]

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

// Helper: get session from request headers
async function getSession(req: { headers: Record<string, string | string[] | undefined> }) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value[0] : value)
  }
  return auth.api.getSession({ headers })
}

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

// Set role after registration — coach gets pending status
app.patch('/api/users/me/role', async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const { role } = req.body as { role: string }
  if (!SELF_ASSIGNABLE_ROLES.includes(role as SelfAssignableRole)) {
    return reply.status(400).send({ error: 'Invalid role' })
  }

  const status = role === 'coach' ? 'pending' : 'active'
  await db.update(user).set({ role: role as SelfAssignableRole, status }).where(eq(user.id, session.user.id))
  return reply.send({ ok: true, status })
})

// Current user profile
app.get('/api/users/me', async (req, reply) => {
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

// ── Admin routes ─────────────────────────────────────────────────────────────

// List pending users (admin/super_admin only)
app.get('/api/admin/pending', async (req, reply) => {
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
app.patch('/api/admin/users/:id/approve', async (req, reply) => {
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

// Reject user (back to student + active)
app.patch('/api/admin/users/:id/reject', async (req, reply) => {
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

// List all users with optional role filter (admin/super_admin only)
app.get('/api/admin/users', async (req, reply) => {
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

app.get('/health', async () => {
  await db.execute(sql`SELECT 1`)
  return { status: 'ok', db: 'connected' }
})

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1)
})
