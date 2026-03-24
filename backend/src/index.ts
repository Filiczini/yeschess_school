import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { db } from './db/index.js'
import { user, coachProfile, enrollment } from './db/schema.js'
import { eq, sql, asc, and } from 'drizzle-orm'
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

// ── Enrollment routes ─────────────────────────────────────────────────────────

// List coaches who have a profile (for assignment dropdown)
app.get('/api/admin/coaches', async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const coachUser = db.select({ id: user.id, name: user.name, email: user.email }).from(user).as('coach_user')

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
app.get('/api/admin/enrollments', async (req, reply) => {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) return reply.status(401).send({ error: 'Unauthorized' })

  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }

  const student = db.select({ id: user.id, name: user.name, email: user.email }).from(user).as('student')
  const coach = db.select({ id: user.id, name: user.name }).from(user).as('coach_user')

  const rows = await db
    .select({
      id: enrollment.id,
      notes: enrollment.notes,
      createdAt: enrollment.createdAt,
      studentId: enrollment.studentId,
      studentName: student.name,
      studentEmail: student.email,
      coachId: enrollment.coachId,
      coachProfileId: coachProfile.id,
      coachName: coach.name,
    })
    .from(enrollment)
    .innerJoin(student, eq(enrollment.studentId, student.id))
    .innerJoin(coachProfile, eq(enrollment.coachId, coachProfile.id))
    .innerJoin(coach, eq(coachProfile.userId, coach.id))
    .orderBy(asc(enrollment.createdAt))

  return reply.send(rows)
})

// Assign student to coach
app.post('/api/admin/enrollments', async (req, reply) => {
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
app.delete('/api/admin/enrollments/:id', async (req, reply) => {
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

app.get('/health', async () => {
  await db.execute(sql`SELECT 1`)
  return { status: 'ok', db: 'connected' }
})

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1)
})
