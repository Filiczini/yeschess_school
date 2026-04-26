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
    it('returns list of children with upcoming bookings', async () => {
      const app = await buildTestApp()
      const mockChildren = [
        { id: 'child-1', name: 'Child One', email: 'child@test.com', level: 'beginner', fideRating: 1000, clubRating: 900, coachName: 'Coach A', coachTitle: 'FM' },
      ]

      const roleFrom = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ role: 'parent' }])),
      }))

      const whereFn = vi.fn(() => Promise.resolve(mockChildren))
      const leftJoin4 = vi.fn(() => ({ where: whereFn }))
      const leftJoin3 = vi.fn(() => ({ leftJoin: leftJoin4 }))
      const leftJoin2 = vi.fn(() => ({ leftJoin: leftJoin3 }))
      const leftJoin1 = vi.fn(() => ({ leftJoin: leftJoin2 }))
      const innerJoin1 = vi.fn(() => ({ leftJoin: leftJoin1 }))
      const childrenFrom = vi.fn(() => ({ innerJoin: innerJoin1 }))

      const groupByFn = vi.fn(() => Promise.resolve([{ studentId: 'child-1', count: 2 }]))
      const whereFn2 = vi.fn(() => ({ groupBy: groupByFn }))
      const bookingsFrom = vi.fn(() => ({ where: whereFn2 }))

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: roleFrom } as any)
        .mockReturnValueOnce({ from: childrenFrom } as any)
        .mockReturnValueOnce({ from: bookingsFrom } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/parent/children',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(1)
      expect(body[0].name).toBe('Child One')
      expect(body[0].upcomingBookings).toBe(2)
    })

    it('returns empty array when no children', async () => {
      const app = await buildTestApp()

      const roleFrom = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ role: 'parent' }])),
      }))

      const whereFn = vi.fn(() => Promise.resolve([]))
      const leftJoin4 = vi.fn(() => ({ where: whereFn }))
      const leftJoin3 = vi.fn(() => ({ leftJoin: leftJoin4 }))
      const leftJoin2 = vi.fn(() => ({ leftJoin: leftJoin3 }))
      const leftJoin1 = vi.fn(() => ({ leftJoin: leftJoin2 }))
      const innerJoin1 = vi.fn(() => ({ leftJoin: leftJoin1 }))
      const childrenFrom = vi.fn(() => ({ innerJoin: innerJoin1 }))

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: roleFrom } as any)
        .mockReturnValueOnce({ from: childrenFrom } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/parent/children',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body).toEqual([])
    })
  })

  describe('POST /api/parent/children', () => {
    it('creates a child account', async () => {
      const app = await buildTestApp()

      const roleFrom = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ role: 'parent' }])),
      }))
      const existingFrom = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      }))

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: roleFrom } as any)
        .mockReturnValueOnce({ from: existingFrom } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/parent/children',
        payload: {
          name: 'New Child',
          email: 'newchild@test.com',
          password: 'password123',
          level: 'beginner',
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.payload)
      expect(body.id).toBe('new-child-1')
      expect(auth.api.signUpEmail).toHaveBeenCalled()
    })

    it('returns 409 when email already exists', async () => {
      const app = await buildTestApp()

      const roleFrom = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ role: 'parent' }])),
      }))
      const existingFrom = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ id: 'existing-user' }])),
      }))

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: roleFrom } as any)
        .mockReturnValueOnce({ from: existingFrom } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/parent/children',
        payload: {
          name: 'New Child',
          email: 'existing@test.com',
          password: 'password123',
          level: 'beginner',
        },
      })

      expect(res.statusCode).toBe(409)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Email вже використовується')
    })
  })
})
