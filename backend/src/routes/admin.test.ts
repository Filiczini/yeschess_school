import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildTestApp } from '../__tests__/helpers/app.js'

vi.mock('../db/index.js', () => {
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve([])),
            })),
          })),
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => Promise.resolve([])),
              })),
            })),
          })),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
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
    transaction: vi.fn(async (fn) => fn(mockDb)),
  }
  return { db: mockDb }
})

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
import { sendCoachAssigned } from '../email.js'

function createThenable(value: any) {
  const result: any = vi.fn()
  result.then = (onFulfilled: any) => Promise.resolve(value).then(onFulfilled)
  return result
}

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
    it('returns paginated user list', async () => {
      const app = await buildTestApp()
      const mockUsers = [
        { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student', status: 'active', plan: 'free', createdAt: new Date().toISOString() },
      ]

      const countFrom = vi.fn(() => {
        const r = createThenable([{ total: 5 }])
        r.where = vi.fn(() => createThenable([{ total: 5 }]))
        return r
      })

      const dataFrom = vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve(mockUsers)),
            })),
          })),
        })),
      }))

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: countFrom } as any)
        .mockReturnValueOnce({ from: dataFrom } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users?page=1&limit=20',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.data).toHaveLength(1)
      expect(body.meta.total).toBe(5)
      expect(body.meta.page).toBe(1)
      expect(body.meta.limit).toBe(20)
    })

    it('filters by role and deleted', async () => {
      const app = await buildTestApp()
      const mockUsers = [{ id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'coach', status: 'active', plan: 'free', createdAt: new Date().toISOString() }]

      const countFrom = vi.fn(() => {
        const r = createThenable([{ total: 1 }])
        r.where = vi.fn(() => createThenable([{ total: 1 }]))
        return r
      })

      const dataFrom = vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve(mockUsers)),
            })),
          })),
        })),
      }))

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: countFrom } as any)
        .mockReturnValueOnce({ from: dataFrom } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users?role=coach&deleted=false',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.data).toHaveLength(1)
    })
  })

  describe('GET /api/admin/stats', () => {
    it('returns dashboard stats', async () => {
      const app = await buildTestApp()

      const fromResult = vi.fn(() => {
        const r = createThenable([{ count: 10 }])
        r.where = vi.fn(() => createThenable([{ count: 2 }]))
        return r
      })

      vi.mocked(db.select).mockReturnValue({
        from: fromResult,
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/stats',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.totalUsers).toBe(10)
      expect(body.pendingCount).toBe(2)
      expect(body.enrollmentsCount).toBe(10)
    })
  })

  describe('DELETE /api/admin/users/:id', () => {
    it('soft deletes a user', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'target-1', role: 'student', deletedAt: null }])),
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

    it('returns 404 when user not found', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440001',
      })

      expect(res.statusCode).toBe(404)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Користувача не знайдено')
    })

    it('returns 400 when already deleted', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'target-1', role: 'student', deletedAt: new Date() }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440001',
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Вже видалено')
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

    it('returns 404 when user not found', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440001/restore',
      })

      expect(res.statusCode).toBe(404)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Користувача не знайдено')
    })

    it('returns 400 when user is not deleted', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: 'target-1', deletedAt: null }])),
        })),
      } as any)

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/550e8400-e29b-41d4-a716-446655440001/restore',
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Користувач не видалений')
    })
  })

  describe('DELETE /api/admin/users/permanent', () => {
    it('permanently deletes eligible users', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([
            { id: '550e8400-e29b-41d4-a716-446655440001', role: 'student', deletedAt: new Date() },
          ])),
        })),
      } as any)

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/users/permanent',
        payload: { ids: ['550e8400-e29b-41d4-a716-446655440001'] },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.ok).toBe(true)
      expect(body.deleted).toBe(1)
    })

    it('returns 400 when no ids provided', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/users/permanent',
        payload: { ids: [] },
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Немає ID для видалення')
    })

    it('returns 400 when no eligible users', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([
            { id: '550e8400-e29b-41d4-a716-446655440001', role: 'student', deletedAt: null },
          ])),
        })),
      } as any)

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/users/permanent',
        payload: { ids: ['550e8400-e29b-41d4-a716-446655440001'] },
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Немає допустимих користувачів для видалення')
    })
  })

  describe('GET /api/admin/coaches', () => {
    it('returns coaches for enrollment dropdown', async () => {
      const app = await buildTestApp()
      const mockCoaches = [
        { coachProfileId: 'cp1', name: 'Coach A', email: 'coach@example.com' },
      ]

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockCoaches)),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/coaches',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(1)
    })
  })

  describe('GET /api/admin/enrollments', () => {
    it('returns paginated enrollments list', async () => {
      const app = await buildTestApp()
      const mockEnrollments = [
        { id: 'e1', notes: null, createdAt: new Date().toISOString(), studentId: 's1', studentName: 'Alice', studentEmail: 'alice@test.com', coachId: 'c1', coachName: 'Coach A' },
      ]

      const innerJoin3 = vi.fn(() => {
        const r = createThenable([{ total: 3 }])
        r.then = (onFulfilled: any) => Promise.resolve([{ total: 3 }]).then(onFulfilled)
        return r
      })
      const innerJoin2 = vi.fn(() => ({ innerJoin: innerJoin3 }))
      const innerJoin1 = vi.fn(() => ({ innerJoin: innerJoin2 }))
      const fromResult1 = { innerJoin: innerJoin1 }

      const offsetFn = vi.fn(() => Promise.resolve(mockEnrollments))
      const limitFn = vi.fn(() => ({ offset: offsetFn }))
      const orderByFn = vi.fn(() => ({ limit: limitFn }))
      const innerJoin3b = vi.fn(() => ({ orderBy: orderByFn }))
      const innerJoin2b = vi.fn(() => ({ innerJoin: innerJoin3b }))
      const innerJoin1b = vi.fn(() => ({ innerJoin: innerJoin2b }))
      const fromResult2 = { innerJoin: innerJoin1b }

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: vi.fn(() => fromResult2) } as any)
        .mockReturnValueOnce({ from: vi.fn(() => fromResult1) } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/enrollments?page=1&limit=20',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.data).toHaveLength(1)
      expect(body.meta.total).toBe(3)
    })
  })

  describe('POST /api/admin/enrollments', () => {
    it('creates enrollment and sends email', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
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
              where: vi.fn(() => Promise.resolve([{ name: 'Coach', email: 'coach@test.com' }]))
            }))
          }))
        } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/admin/enrollments',
        payload: {
          studentId: '550e8400-e29b-41d4-a716-446655440002',
          coachId: '550e8400-e29b-41d4-a716-446655440001',
        },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.payload)
      expect(body.id).toBeDefined()
      expect(sendCoachAssigned).toHaveBeenCalled()
    })

    it('returns 400 when missing studentId or coachId', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'POST',
        url: '/api/admin/enrollments',
        payload: { studentId: '', coachId: '550e8400-e29b-41d4-a716-446655440001' },
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('studentId and coachId are required')
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

  describe('DELETE /api/admin/enrollments/:id', () => {
    it('deletes an enrollment', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/admin/enrollments/550e8400-e29b-41d4-a716-446655440001',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.ok).toBe(true)
    })
  })
})
