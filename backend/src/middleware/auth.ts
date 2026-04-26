import type { FastifyRequest, FastifyReply } from 'fastify'
import { getSession, type Session } from '../lib/session.js'
import { db } from '../db/index.js'
import { user } from '../db/schema.js'
import { eq } from 'drizzle-orm'

declare module 'fastify' {
  interface FastifyRequest {
    session: Session
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await getSession(req as Parameters<typeof getSession>[0])
    if (!session) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    req.session = session
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

export function requireRole(...roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const sessionRole = (req.session.user as any).role as string | undefined
    if (sessionRole && roles.includes(sessionRole)) return

    // Fallback: fresh DB lookup (handles stale cookieCache after config changes)
    const [u] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, req.session.user.id))
    if (!u || !roles.includes(u.role)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
  }
}
