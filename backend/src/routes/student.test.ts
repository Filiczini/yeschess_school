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
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'profile-1' }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'profile-1' }])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}))

vi.mock('../middleware/auth.js', () => ({
  requireAuth: vi.fn((req, reply, done) => {
    ;(req as any).session = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'student@example.com',
        name: 'Student User',
        role: 'student',
      },
    }
    done()
  }),
  requireRole: vi.fn((...roles) => (req, reply, done) => done()),
}))

import { db } from '../db/index.js'

describe('Student Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/student/profile', () => {
    it('returns profile when it exists', async () => {
      const app = await buildTestApp()
      const mockProfile = { id: 'profile-1', userId: '550e8400-e29b-41d4-a716-446655440002', level: 'beginner' }

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([mockProfile])),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/student/profile',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.level).toBe('beginner')
    })

    it('returns null when profile does not exist', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/student/profile',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body).toBeNull()
    })
  })

  describe('PUT /api/student/profile', () => {
    it('creates new profile when none exists', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PUT',
        url: '/api/student/profile',
        payload: { level: 'intermediate', fideRating: 1500 },
      })

      expect(res.statusCode).toBe(201)
    })

    it('updates existing profile', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'profile-1' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PUT',
        url: '/api/student/profile',
        payload: { level: 'advanced' },
      })

      expect(res.statusCode).toBe(200)
    })
  })

  describe('GET /api/student/coach', () => {
    it('returns assigned coach or null', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => Promise.resolve([{ coachName: 'Coach A' }])),
            })),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/student/coach',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body).not.toBeNull()
    })
  })

  describe('GET /api/student/bookings', () => {
    it('returns student bookings', async () => {
      const app = await buildTestApp()

      const mockBookings = [
        { id: 'b1', status: 'confirmed', coachName: 'Coach A' },
        { id: 'b2', status: 'pending', coachName: 'Coach B' },
      ]

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn(() => Promise.resolve(mockBookings)),
              })),
            })),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/student/bookings',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(2)
    })
  })

  describe('PATCH /api/student/bookings/:id/cancel', () => {
    it('cancels own booking', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'booking-1', status: 'pending' }])),
        })),
      } as any)

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([{ id: 'booking-1', status: 'cancelled' }])),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/student/bookings/550e8400-e29b-41d4-a716-446655440001/cancel',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.status).toBe('cancelled')
    })

    it('returns 404 for non-existent booking', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/student/bookings/550e8400-e29b-41d4-a716-446655440999/cancel',
      })

      expect(res.statusCode).toBe(404)
    })

    it('returns 409 when already cancelled', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'booking-1', status: 'cancelled' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/student/bookings/550e8400-e29b-41d4-a716-446655440001/cancel',
      })

      expect(res.statusCode).toBe(409)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Already cancelled')
    })
  })

  describe('GET /api/student/parent', () => {
    it('returns parent info when linked', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([{ id: 'parent-1', name: 'Parent User', email: 'parent@test.com', phone: '+380991111111', contactMethod: 'telegram' }])),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/student/parent',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.name).toBe('Parent User')
    })

    it('returns null when no parent linked', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/student/parent',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body).toBeNull()
    })
  })

  describe('POST /api/student/link-code', () => {
    it('generates a 10-char link code for students', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'student' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/student/link-code',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.code).toBeDefined()
      expect(body.code.length).toBe(10)
      expect(body.expiresAt).toBeDefined()
    })

    it('returns 403 for non-students', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'coach' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/student/link-code',
      })

      expect(res.statusCode).toBe(403)
    })
  })
})
