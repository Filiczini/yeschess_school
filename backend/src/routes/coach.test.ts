import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildTestApp } from '../__tests__/helpers/app.js'

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
          limit: vi.fn(() => Promise.resolve([])),
        })),
        innerJoin: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'schedule-1' }])),
        onConflictDoUpdate: vi.fn(() => Promise.resolve()),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'profile-1' }])),
        })),
      })),
    })),
  },
}))

vi.mock('../lib/profile.js', () => ({
  getCoachProfile: vi.fn(),
}))

vi.mock('../middleware/auth.js', () => ({
  requireAuth: vi.fn((req, reply, done) => {
    ;(req as any).session = {
      user: {
        id: 'coach-1',
        email: 'coach@example.com',
        name: 'Coach User',
        role: 'coach',
      },
    }
    done()
  }),
  requireRole: vi.fn((...roles) => (req, reply, done) => done()),
}))

import { db } from '../db/index.js'
import { getCoachProfile } from '../lib/profile.js'

describe('Coach Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/coach/profile', () => {
    it('returns profile when it exists', async () => {
      const app = await buildTestApp()
      const mockProfile = { id: 'profile-1', userId: 'coach-1', bio: 'Test bio' }

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([mockProfile])),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/coach/profile',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.id).toBe('profile-1')
      expect(body.bio).toBe('Test bio')
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
        url: '/api/coach/profile',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body).toBeNull()
    })
  })

  describe('PUT /api/coach/profile', () => {
    it('creates new profile when none exists', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'coach' }])),
        })),
      } as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PUT',
        url: '/api/coach/profile',
        payload: {
          hourlyRate: '500.00',
          bio: 'New coach',
        },
      })

      expect(res.statusCode).toBe(201)
    })

    it('updates existing profile', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'coach' }])),
        })),
      } as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'profile-1' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PUT',
        url: '/api/coach/profile',
        payload: {
          hourlyRate: '600.00',
          bio: 'Updated bio',
        },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body).toBeDefined()
    })

    it('returns 403 for non-coach users', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'student' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PUT',
        url: '/api/coach/profile',
        payload: { hourlyRate: '500.00' },
      })

      expect(res.statusCode).toBe(403)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Only coaches')
    })

    it('returns 400 when hourlyRate is missing', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ role: 'coach' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PUT',
        url: '/api/coach/profile',
        payload: { bio: 'Missing rate' },
      })

      expect(res.statusCode).toBe(400)
      // Fastify schema validation rejects missing required field before handler
    })
  })

  describe('GET /api/coach/students', () => {
    it('returns 403 when coach profile not found', async () => {
      const app = await buildTestApp()
      vi.mocked(getCoachProfile).mockResolvedValue(null)

      const res = await app.inject({
        method: 'GET',
        url: '/api/coach/students',
      })

      expect(res.statusCode).toBe(403)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Coach profile not found')
    })

    it('returns list of students', async () => {
      const app = await buildTestApp()
      vi.mocked(getCoachProfile).mockResolvedValue({ id: 'profile-1' } as any)

      const mockStudents = [
        { enrollmentId: 'e1', studentId: 's1', studentName: 'Alice', studentEmail: 'alice@test.com', enrolledAt: new Date().toISOString(), notes: null, level: 'beginner', fideRating: 1000, clubRating: 900, chesscomUsername: 'alicechess', lichessUsername: 'alicelichess' },
      ]

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            leftJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn(() => Promise.resolve(mockStudents)),
              })),
            })),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/coach/students',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(1)
      expect(body[0].studentName).toBe('Alice')
    })
  })

  describe('GET /api/coach/schedule', () => {
    it('returns schedule for coach', async () => {
      const app = await buildTestApp()
      vi.mocked(getCoachProfile).mockResolvedValue({ id: 'profile-1' } as any)

      const mockSchedule = [
        { id: 's1', dayOfWeek: 0, startTime: '09:00', endTime: '18:00', slotDuration: 60 },
      ]

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockSchedule)),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/coach/schedule',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(1)
      expect(body[0].dayOfWeek).toBe(0)
    })
  })

  describe('PUT /api/coach/schedule', () => {
    it('returns 400 when payload is not an array', async () => {
      const app = await buildTestApp()
      vi.mocked(getCoachProfile).mockResolvedValue({ id: 'profile-1' } as any)

      const res = await app.inject({
        method: 'PUT',
        url: '/api/coach/schedule',
        payload: { dayOfWeek: 1 },
      })

      expect(res.statusCode).toBe(400)
      // Fastify schema validation rejects non-array body before handler
    })

    it('saves schedule slots successfully', async () => {
      const app = await buildTestApp()
      vi.mocked(getCoachProfile).mockResolvedValue({ id: 'profile-1' } as any)

      const res = await app.inject({
        method: 'PUT',
        url: '/api/coach/schedule',
        payload: [
          { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', slotDuration: 60, isActive: true },
          { dayOfWeek: 1, startTime: '10:00', endTime: '16:00', slotDuration: 45, isActive: false },
        ],
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.ok).toBe(true)
    })
  })
})
