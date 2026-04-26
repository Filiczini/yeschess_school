import type { FastifyRequest, FastifyReply } from 'fastify'
import { getSession, type Session } from '../lib/session.js'

declare module 'fastify' {
  interface FastifyRequest {
    session: Session
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const session = await getSession(req as Parameters<typeof getSession>[0])
  if (!session) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
  req.session = session
}

export function requireRole(...roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(req.session.user.role ?? '')) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
  }
}
