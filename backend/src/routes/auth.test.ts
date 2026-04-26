import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildTestApp } from '../__tests__/helpers/app.js'

const mockHandlers = {
  authHandler: vi.fn(),
}

vi.mock('../auth.js', () => ({
  auth: { handler: (...args: any[]) => mockHandlers.authHandler(...args) },
}))

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}))

import { db } from '../db/index.js'

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/auth/get-session', () => {
    it('forwards request to auth.handler and returns session', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ user: { id: 'u1', email: 'a@b.com' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/get-session',
        headers: { cookie: 'session=abc' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.user.id).toBe('u1')

      const callArg = mockHandlers.authHandler.mock.calls[0][0] as Request
      expect(callArg.method).toBe('GET')
      expect(callArg.url).toContain('/api/auth/get-session')
    })
  })

  describe('POST /api/auth/sign-in/email', () => {
    it('allows sign-in for active user', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ user: { id: 'u1' }, session: { token: 'tok1' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ deletedAt: null, status: 'active' }])),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        payload: { email: 'a@b.com', password: 'secret' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.user.id).toBe('u1')
    })

    it('blocks sign-in for soft-deleted user (401)', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ user: { id: 'u1' }, session: { token: 'tok1' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ deletedAt: new Date(), status: 'active' }])),
          })),
        })),
      } as any)

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn(() => Promise.resolve()),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        payload: { email: 'a@b.com', password: 'secret' },
      })

      expect(res.statusCode).toBe(401)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('заблоковано')
      expect(db.delete).toHaveBeenCalled()
    })

    it('blocks sign-in for suspended user (401)', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ user: { id: 'u1' }, session: { token: 'tok1' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ deletedAt: null, status: 'suspended' }])),
          })),
        })),
      } as any)

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn(() => Promise.resolve()),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        payload: { email: 'a@b.com', password: 'secret' },
      })

      expect(res.statusCode).toBe(401)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('заблоковано')
    })

    it('returns 200 when user not found in DB after sign-in', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ user: { id: 'u1' }, session: { token: 'tok1' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        payload: { email: 'a@b.com', password: 'secret' },
      })

      expect(res.statusCode).toBe(200)
    })

    it('forwards non-200 auth responses unchanged', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        payload: { email: 'a@b.com', password: 'wrong' },
      })

      expect(res.statusCode).toBe(401)
      const body = JSON.parse(res.payload)
      expect(body.error).toBe('Invalid credentials')
    })
  })

  describe('Request forwarding', () => {
    it('strips proxy headers before forwarding', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      await app.inject({
        method: 'GET',
        url: '/api/auth/get-session',
        headers: {
          'x-forwarded-proto': 'https',
          'x-forwarded-for': '1.2.3.4',
          'x-forwarded-host': 'api.example.com',
          'x-real-ip': '1.2.3.4',
          'content-length': '999',
          'cookie': 'session=abc',
          'custom-header': 'value',
        },
      })

      const callArg = mockHandlers.authHandler.mock.calls[0][0] as Request
      const headers = Object.fromEntries(callArg.headers.entries())
      expect(headers['x-forwarded-proto']).toBeUndefined()
      expect(headers['x-forwarded-for']).toBeUndefined()
      expect(headers['x-real-ip']).toBeUndefined()
      expect(headers['content-length']).toBeUndefined()
      expect(headers['custom-header']).toBe('value')
    })

    it('builds URL using x-forwarded-proto when present', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      await app.inject({
        method: 'GET',
        url: '/api/auth/get-session',
        headers: {
          'x-forwarded-proto': 'https',
        },
      })

      const callArg = mockHandlers.authHandler.mock.calls[0][0] as Request
      expect(callArg.url.startsWith('https://')).toBe(true)
    })

    it('defaults to http when x-forwarded-proto is absent', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      await app.inject({
        method: 'GET',
        url: '/api/auth/get-session',
      })

      const callArg = mockHandlers.authHandler.mock.calls[0][0] as Request
      expect(callArg.url.startsWith('http://')).toBe(true)
    })

    it('forwards JSON body for POST requests', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        payload: { email: 'a@b.com', password: 'secret', name: 'Test' },
      })

      const callArg = mockHandlers.authHandler.mock.calls[0][0] as Request
      const bodyText = await callArg.text()
      const body = JSON.parse(bodyText)
      expect(body.email).toBe('a@b.com')
    })

    it('does not send body for GET requests', async () => {
      const app = await buildTestApp()

      mockHandlers.authHandler.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      await app.inject({
        method: 'GET',
        url: '/api/auth/get-session',
      })

      const callArg = mockHandlers.authHandler.mock.calls[0][0] as Request
      expect(callArg.body).toBeNull()
    })
  })
})
