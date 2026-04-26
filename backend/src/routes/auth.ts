import type { FastifyInstance } from 'fastify'
import { auth } from '../auth.js'
import { db } from '../db/index.js'
import { user, session as sessionTable } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export default async function authRoutes(app: FastifyInstance) {
  app.all('/api/auth/*', {
    config: { rateLimit: { max: process.env.NODE_ENV === 'production' ? 200 : 1000, timeWindow: '15 minutes' } },
  }, async (req, reply) => {
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'http'
    const url = `${proto}://${req.headers.host}${req.url}`

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

    // Block sign-in for soft-deleted / suspended accounts
    if (req.method === 'POST' && req.url.includes('/sign-in') && response.status === 200) {
      const responseText = await response.text()
      try {
        const data = JSON.parse(responseText) as { user?: { id?: string }; session?: { token?: string } }
        if (data?.user?.id) {
          const [dbUser] = await db
            .select({ deletedAt: user.deletedAt, status: user.status })
            .from(user)
            .where(eq(user.id, data.user.id))
            .limit(1)
          if (dbUser && (dbUser.deletedAt !== null || dbUser.status === 'suspended')) {
            if (data.session?.token) {
              await db.delete(sessionTable).where(eq(sessionTable.token, data.session.token))
            }
            return reply.status(401).send({ error: 'Акаунт заблоковано або видалено' })
          }
        }
      } catch {
        // If parsing fails, forward the original response
      }
      reply.status(response.status)
      response.headers.forEach((value, key) => reply.header(key, value))
      return reply.send(responseText)
    }

    reply.status(response.status)
    response.headers.forEach((value, key) => reply.header(key, value))
    return reply.send(await response.text())
  })
}
