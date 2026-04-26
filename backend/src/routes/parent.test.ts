import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildTestApp } from '../__tests__/helpers/app.js'

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          orderBy: vi.fn(() => Promise.resolve([])),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'child-1' }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}))

vi.mock('../auth.js', () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(() => Promise.resolve({ user: { id: 'new-child-1' } })),
    },
  },
}))

vi.mock('../middleware/auth.js', () => ({
  requireAuth: vi.fn((req, reply, done) => {
    ;(req as any).session = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'parent@example.com',
        name: 'Parent User',
        role: 'parent',
      },
    }
    done()
  }),
  requireRole: vi.fn((...roles) => (req, reply, done) => done()),
}))

import { db } from '../db/index.js'
import { auth } from '../auth.js'

describe('Parent Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PATCH /api/parent/profile', () => {
    it('updates parent profile', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'parent' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/parent/profile',
        payload: { name: 'Updated Parent', phone: '+380991234567' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.ok).toBe(true)
    })

    it('returns 403 for non-parents', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'student' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/parent/profile',
        payload: { phone: '+380991234567' },
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('POST /api/parent/link-child', () => {
    it('links child with valid code', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'parent' }])),
        })),
      } as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([{
              studentId: '550e8400-e29b-41d4-a716-446655440002',
              expiresAt: new Date(Date.now() + 3600000),
              name: 'Child User',
            }])),
          })),
        })),
      } as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/parent/link-child',
        payload: { code: 'A3KX9MNP2Q' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.childId).toBeDefined()
      expect(body.childName).toBe('Child User')
    })

    it('returns 404 for invalid code', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'parent' }])),
        })),
      } as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/parent/link-child',
        payload: { code: 'INVALID' },
      })

      expect(res.statusCode).toBe(404)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Код не знайдено')
    })

    it('returns 400 for expired code', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'parent' }])),
        })),
      } as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([{
              studentId: '550e8400-e29b-41d4-a716-446655440002',
              expiresAt: new Date(Date.now() - 3600000),
              name: 'Child User',
            }])),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/parent/link-child',
        payload: { code: 'A3KX9MNP2Q' },
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Код прострочений')
    })

    it('returns 409 when child already linked', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'parent' }])),
        })),
      } as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([{
              studentId: '550e8400-e29b-41d4-a716-446655440002',
              expiresAt: new Date(Date.now() + 3600000),
              name: 'Child User',
            }])),
          })),
        })),
      } as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'link-1' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/parent/link-child',
        payload: { code: 'A3KX9MNP2Q' },
      })

      expect(res.statusCode).toBe(409)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('вже прив\'язано')
    })
  })

  describe('GET /api/parent/children', () => {
    it.skip('returns list of children', async () => {
      // Complex Drizzle joins deferred to integration tests with real DB
    })
  })

  describe('POST /api/parent/children', () => {
    it.skip('creates a child account', async () => {
      // Requires auth.api.signUpEmail mock + DB integration
    })

    it.skip('returns 409 when email already exists', async () => {
      // Requires DB integration
    })
  })
})
