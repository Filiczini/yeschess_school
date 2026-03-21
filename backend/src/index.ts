import 'dotenv/config'
import Fastify from 'fastify'
import { db } from './db/index.js'
import { sql } from 'drizzle-orm'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.js'

const app = Fastify({ logger: true })

// Better Auth — handles all /api/auth/* routes
app.all('/api/auth/*', async (req, reply) => {
  await toNodeHandler(auth)(req.raw, reply.raw)
})

app.get('/health', async () => {
  await db.execute(sql`SELECT 1`)
  return { status: 'ok', db: 'connected' }
})

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1)
})
