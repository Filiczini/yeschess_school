import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireAuth, requireRole } from './auth.js'
import type { FastifyRequest, FastifyReply } from 'fastify'

// Mock session helper
vi.mock('../lib/session.js', () => ({
  getSession: vi.fn(),
}))

// Mock DB
vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}))

// Mock eq helper
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>('drizzle-orm')
  return {
    ...actual,
    eq: vi.fn(() => ({} as any)),
  }
})

import { getSession } from '../lib/session.js'
import { db } from '../db/index.js'

function mockRequest(): FastifyRequest {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    url: '/test',
    method: 'GET',
    raw: {} as any,
    id: 'req-1',
    log: {} as any,
  } as unknown as FastifyRequest
}

function mockReply(): FastifyReply {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
  }
  return reply as unknown as FastifyReply
}

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no session is present', async () => {
    const req = mockRequest()
    const reply = mockReply()
    vi.mocked(getSession).mockResolvedValue(undefined)

    await requireAuth(req, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })

  it('attaches session to request when authenticated', async () => {
    const session = { user: { id: 'user-1', name: 'Test', email: 'test@example.com' } } as any
    const req = mockRequest()
    const reply = mockReply()
    vi.mocked(getSession).mockResolvedValue(session)

    await requireAuth(req, reply)

    expect(req.session).toBe(session)
    expect(reply.status).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 401 when getSession throws', async () => {
    const req = mockRequest()
    const reply = mockReply()
    vi.mocked(getSession).mockRejectedValue(new Error('Session error'))

    await requireAuth(req, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })
})

describe('requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows access when role matches session role', async () => {
    const req = mockRequest()
    ;(req as any).session = { user: { id: 'user-1', role: 'admin' } }
    const reply = mockReply()
    const handler = requireRole('admin', 'super_admin')

    await handler(req, reply)

    expect(reply.status).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('allows access when role matches (student)', async () => {
    const req = mockRequest()
    ;(req as any).session = { user: { id: 'user-1', role: 'student' } }
    const reply = mockReply()
    const handler = requireRole('student')

    await handler(req, reply)

    expect(reply.status).not.toHaveBeenCalled()
  })

  it('returns 403 when role does not match and DB confirms mismatch', async () => {
    const req = mockRequest()
    ;(req as any).session = { user: { id: 'user-1', role: 'student' } }
    const reply = mockReply()
    const handler = requireRole('admin')

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ role: 'student' }])),
      })),
    } as any)

    await handler(req, reply)

    expect(reply.status).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({ error: 'Forbidden' })
  })

  it('allows access when DB fallback confirms role', async () => {
    const req = mockRequest()
    ;(req as any).session = { user: { id: 'user-1', role: 'admin' } }
    const reply = mockReply()
    const handler = requireRole('admin')

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ role: 'admin' }])),
      })),
    } as any)

    await handler(req, reply)

    expect(reply.status).not.toHaveBeenCalled()
  })
})
