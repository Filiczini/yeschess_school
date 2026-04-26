import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { lead } from '../db/schema.js'
import { sql } from 'drizzle-orm'

export default async function publicRoutes(app: FastifyInstance) {
  app.post('/api/leads', {
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    schema: {
      tags: ['Public'],
      summary: 'Залишити заявку (публічна форма)',
      security: [],
      body: {
        type: 'object',
        required: ['name', 'contact'],
        properties: {
          name: { type: 'string', description: 'Ім\'я' },
          contact: { type: 'string', description: 'Телефон або email' },
          comment: { type: 'string', description: 'Коментар' },
          // honeypot field — bots fill it, humans don't
          website: { type: 'string' },
        },
      },
      response: {
        201: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        400: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const { name, contact, comment, website } = req.body as {
      name: string; contact: string; comment?: string; website?: string
    }

    // Honeypot: bots fill hidden fields, silently discard
    if (website) return reply.status(201).send({ id: '00000000-0000-0000-0000-000000000000' })

    if (!name || !contact) {
      return reply.status(400).send({ error: 'name and contact are required' })
    }

    const [created] = await db.insert(lead).values({ name, contact, comment }).returning({ id: lead.id })
    return reply.status(201).send(created)
  })

  app.get('/health', {
    schema: {
      tags: ['Public'],
      summary: 'Health check',
      security: [],
      response: {
        200: { type: 'object', properties: { status: { type: 'string' }, db: { type: 'string' } } },
      },
    },
  }, async () => {
    await db.execute(sql`SELECT 1`)
    return { status: 'ok', db: 'connected' }
  })
}
