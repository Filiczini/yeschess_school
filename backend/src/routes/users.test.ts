import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildTestApp } from '../__tests__/helpers/app.js'

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}))

vi.mock('../email.js', () => ({
  sendWelcome: vi.fn(() => Promise.resolve()),
}))

vi.mock('../middleware/auth.js', () => ({
  requireAuth: vi.fn((req, reply, done) => {
    ;(req as any).session = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
      },
    }
    done()
  }),
  requireRole: vi.fn((...roles) => (req, reply, done) => done()),
}))

import { db } from '../db/index.js'
import { sendWelcome } from '../email.js'

describe('Users Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PATCH /api/users/me/role', () => {
    it('assigns role for the first time', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'student' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/users/me/role',
        payload: { role: 'coach' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.ok).toBe(true)
      expect(body.status).toBe('pending')
      expect(sendWelcome).toHaveBeenCalled()
    })

    it('returns 400 for invalid role', async () => {
      const app = await buildTestApp()
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/users/me/role',
        payload: { role: 'admin' },
      })

      expect(res.statusCode).toBe(400)
      // Fastify schema validation rejects 'admin' before our handler runs
    })

    it('returns 400 when role already assigned', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'coach' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/users/me/role',
        payload: { role: 'student' },
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toBe('Role already assigned')
    })
  })

  describe('GET /api/users/me', () => {
    it('returns current user profile', async () => {
      const app = await buildTestApp()
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
        status: 'active',
        plan: 'free',
        phone: null,
        contactMethod: null,
        instagram: null,
      }

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([mockUser])),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/users/me',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.id).toBe('user-1')
      expect(body.email).toBe('test@example.com')
      expect(body.role).toBe('student')
    })
  })
})
