import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { db } from './db/index.js'
import { user } from './db/schema.js'
import { eq, sql } from 'drizzle-orm'
import { auth } from './auth.js'

const SELF_ASSIGNABLE_ROLES = ['student', 'parent', 'coach'] as const
type SelfAssignableRole = typeof SELF_ASSIGNABLE_ROLES[number]

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

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

// Set role after registration (only student/parent/coach allowed)
app.patch('/api/users/me/role', async (req, reply) => {
  const webRequest = new Request(`http://${req.headers.host}/api/auth/get-session`, {
    headers: new Headers(req.headers as Record<string, string>),
  })
  const session = await auth.api.getSession({ headers: webRequest.headers })

  if (!session) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  const { role } = req.body as { role: string }

  if (!SELF_ASSIGNABLE_ROLES.includes(role as SelfAssignableRole)) {
    return reply.status(400).send({ error: 'Invalid role' })
  }

  await db.update(user).set({ role: role as SelfAssignableRole }).where(eq(user.id, session.user.id))
  return reply.send({ ok: true })
})

app.get('/health', async () => {
  await db.execute(sql`SELECT 1`)
  return { status: 'ok', db: 'connected' }
})

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1)
})
