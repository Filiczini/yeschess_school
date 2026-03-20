import 'dotenv/config'
import Fastify from 'fastify'
import { db } from './db'
import { sql } from 'drizzle-orm'

const app = Fastify({ logger: true })

app.get('/health', async () => {
  const result = await db.execute(sql`SELECT 1`)
  return { status: 'ok', db: 'connected' }
})

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1)
})
