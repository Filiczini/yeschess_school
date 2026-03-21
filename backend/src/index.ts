import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { db } from './db/index.js'
import { sql } from 'drizzle-orm'
import { auth } from './auth.js'

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

app.get('/health', async () => {
  await db.execute(sql`SELECT 1`)
  return { status: 'ok', db: 'connected' }
})

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1)
})
