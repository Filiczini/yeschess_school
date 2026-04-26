import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildTestApp } from '../__tests__/helpers/app.js'

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
          limit: vi.fn(() => Promise.resolve([])),
          offset: vi.fn(() => Promise.resolve([])),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => Promise.resolve([])),
              })),
            })),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440001', status: 'pending' }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440001', status: 'confirmed' }])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}))

vi.mock('../lib/profile.js', () => ({
  getCoachProfile: vi.fn(),
}))

vi.mock('../email.js', () => ({
  sendBookingConfirmed: vi.fn(() => Promise.resolve()),
  sendBookingCancelled: vi.fn(() => Promise.resolve()),
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
import { getCoachProfile } from '../lib/profile.js'
import { sendBookingConfirmed, sendBookingCancelled } from '../email.js'

function createThenable(value: any) {
  const result: any = vi.fn()
  result.then = (onFulfilled: any) => Promise.resolve(value).then(onFulfilled)
  return result
}

describe('Bookings Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/coaches/:coachId/slots', () => {
    it('returns empty array when no schedule for day', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/coaches/550e8400-e29b-41d4-a716-446655440001/slots?date=2026-05-01',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body).toEqual([])
    })

    it('returns available slots for a coach', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{
            startTime: '09:00',
            endTime: '12:00',
            slotDuration: 60,
            isActive: true,
          }])),
        })),
      } as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/coaches/550e8400-e29b-41d4-a716-446655440001/slots?date=2026-05-01',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThan(0)
      expect(body[0]).toHaveProperty('time')
      expect(body[0]).toHaveProperty('available')
    })
  })

  describe('POST /api/bookings', () => {
    it('creates a booking successfully', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        payload: {
          coachId: '550e8400-e29b-41d4-a716-446655440001',
          date: '2026-05-01',
          time: '10:00',
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.payload)
      expect(body.id).toBeDefined()
      expect(body.status).toBe('pending')
    })

    it('returns 409 on double booking (unique constraint)', async () => {
      const app = await buildTestApp()

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => {
            const err = new Error('unique violation') as any
            err.code = '23505'
            throw err
          }),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        payload: {
          coachId: '550e8400-e29b-41d4-a716-446655440001',
          date: '2026-05-01',
          time: '10:00',
        },
      })

      expect(res.statusCode).toBe(409)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Slot already booked')
    })
  })

  describe('GET /api/coach/bookings', () => {
    it('returns paginated bookings for coach', async () => {
      const app = await buildTestApp()
      vi.mocked(getCoachProfile).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440001' } as any)

      const mockBookings = [
        { id: 'b1', status: 'pending', scheduledAt: new Date().toISOString(), durationMin: 60, notes: null, cancelReason: null, studentId: 's1', studentName: 'Alice', studentEmail: 'alice@test.com' },
      ]

      const countFrom = vi.fn(() => {
        const r = createThenable([{ total: 5 }])
        r.where = vi.fn(() => createThenable([{ total: 5 }]))
        return r
      })

      const dataFrom = vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => Promise.resolve(mockBookings)),
              })),
            })),
          })),
        })),
      }))

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: countFrom } as any)
        .mockReturnValueOnce({ from: dataFrom } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/coach/bookings?page=1&limit=20',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.data).toHaveLength(1)
      expect(body.meta.total).toBe(5)
    })

    it('returns 403 when coach profile not found', async () => {
      const app = await buildTestApp()
      vi.mocked(getCoachProfile).mockResolvedValue(null)

      const res = await app.inject({
        method: 'GET',
        url: '/api/coach/bookings',
      })

      expect(res.statusCode).toBe(403)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Coach profile not found')
    })
  })

  describe('PATCH /api/bookings/:id/status', () => {
    it('confirms a booking and sends email', async () => {
      const app = await buildTestApp()
      vi.mocked(getCoachProfile).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440001' } as any)

      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([{ id: 'b1' }])),
          })),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([{ scheduledAt: new Date().toISOString(), durationMin: 60, studentId: 's1' }])),
          })),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([{ name: 'Student', email: 'student@test.com' }])),
          })),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => Promise.resolve([{ name: 'Coach' }]))
            }))
          }))
        } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/bookings/550e8400-e29b-41d4-a716-446655440001/status',
        payload: { status: 'confirmed' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.status).toBe('confirmed')
      expect(sendBookingConfirmed).toHaveBeenCalled()
    })

    it('returns 404 for non-existent booking', async () => {
      const app = await buildTestApp()
      vi.mocked(getCoachProfile).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440001' } as any)

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/bookings/550e8400-e29b-41d4-a716-446655440999/status',
        payload: { status: 'confirmed' },
      })

      expect(res.statusCode).toBe(404)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Booking not found')
    })
  })
})
