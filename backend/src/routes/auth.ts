import type { FastifyInstance } from 'fastify'
import { auth } from '../auth.js'
import { db } from '../db/index.js'
import { user, session as sessionTable } from '../db/schema.js'
import { eq } from 'drizzle-orm'

// Headers added by reverse proxies — must not be forwarded to auth.handler
// because they conflict with the internal http:// URL we build for the handler
const PROXY_HEADERS = new Set([
  'x-forwarded-proto',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-real-ip',
  'content-length',  // will be recomputed from the body we pass
])

export default async function authRoutes(app: FastifyInstance) {
  app.all('/api/auth/*', {
    config: { rateLimit: { max: 500, timeWindow: '15 minutes' } },
  }, async (req, reply) => {
    const url = `http://${req.headers.host}${req.url}`

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value && !PROXY_HEADERS.has(key.toLowerCase())) {
        headers.set(key, Array.isArray(value) ? value[0] : value)
      }
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
        // parsing failed — forward original response
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
