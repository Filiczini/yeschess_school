import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildTestApp } from '../__tests__/helpers/app.js'

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'enrollment-1' }])),
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

vi.mock('../email.js', () => ({
  sendCoachAssigned: vi.fn(() => Promise.resolve()),
}))

vi.mock('../middleware/auth.js', () => ({
  requireAuth: vi.fn((req, reply, done) => {
    ;(req as any).session = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440004',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'super_admin',
      },
    }
    done()
  }),
  requireRole: vi.fn((...roles) => (req, reply, done) => done()),
}))

import { db } from '../db/index.js'

describe('Admin Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/pending', () => {
    it('returns pending users list', async () => {
      const app = await buildTestApp()
      const mockUsers = [
        { id: 'user-1', name: 'Coach A', email: 'a@example.com', role: 'coach', status: 'pending' },
        { id: 'user-2', name: 'Coach B', email: 'b@example.com', role: 'coach', status: 'pending' },
      ]

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(mockUsers)),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/pending',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(2)
    })
  })

  describe('PATCH /api/admin/users/:id/approve', () => {
    it('approves a pending user', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440001/approve',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.ok).toBe(true)
    })
  })

  describe('PATCH /api/admin/users/:id/reject', () => {
    it('rejects a coach application', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440001/reject',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.ok).toBe(true)
    })
  })

  describe('GET /api/admin/users', () => {
    it.skip('returns paginated user list', async () => {
      // Complex Promise.all with count + data queries — deferred to integration tests
    })
  })

  describe('GET /api/admin/stats', () => {
    it.skip('returns dashboard stats', async () => {
      // Multiple parallel count queries — deferred to integration tests
    })
  })

  describe('DELETE /api/admin/users/:id', () => {
    it('soft deletes a user', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'target-1', role: 'student' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440001',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.ok).toBe(true)
    })

    it('prevents self-deletion', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440004',
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Не можна видалити себе')
    })

    it('prevents deleting super_admin', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'target-1', role: 'super_admin' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440001',
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Не можна видалити super_admin')
    })
  })

  describe('PATCH /api/admin/users/:id/restore', () => {
    it('restores soft-deleted user', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'target-1', deletedAt: new Date() }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440001/restore',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.ok).toBe(true)
    })
  })

  describe('GET /api/admin/coaches', () => {
    it.skip('returns coaches for enrollment dropdown', async () => {
      // Complex joins — deferred to integration tests
    })
  })

  describe('POST /api/admin/enrollments', () => {
    it.skip('creates enrollment and sends email', async () => {
      // Requires complex DB mocks for student/coach lookup + email
    })

    it('returns 409 for duplicate enrollment', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'existing-enrollment' }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/admin/enrollments',
        payload: {
          studentId: '550e8400-e29b-41d4-a716-446655440002',
          coachId: '550e8400-e29b-41d4-a716-446655440001',
        },
      })

      expect(res.statusCode).toBe(409)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Enrollment already exists')
    })
  })
})
