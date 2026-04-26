import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildTestApp } from '../__tests__/helpers/app.js'

// Mock the DB layer
vi.mock('../db/index.js', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000' }])),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
    execute: vi.fn(() => Promise.resolve()),
  },
}))

describe('Public Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/leads', () => {
    it('creates a lead with valid data', async () => {
      const app = await buildTestApp()
      const res = await app.inject({
        method: 'POST',
        url: '/api/leads',
        payload: { name: 'John Doe', contact: 'john@example.com', comment: 'Interested' },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.payload)
      expect(body.id).toBeDefined()
    })

    it('returns 400 when name is missing', async () => {
      const app = await buildTestApp()
      const res = await app.inject({
        method: 'POST',
        url: '/api/leads',
        payload: { contact: 'john@example.com' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when contact is missing', async () => {
      const app = await buildTestApp()
      const res = await app.inject({
        method: 'POST',
        url: '/api/leads',
        payload: { name: 'John Doe' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('silently discards honeypot submissions', async () => {
      const app = await buildTestApp()
      const res = await app.inject({
        method: 'POST',
        url: '/api/leads',
        payload: { name: 'Bot', contact: 'bot@evil.com', website: 'http://spam.com' },
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.payload)
      expect(body.id).toBe('00000000-0000-0000-0000-000000000000')
    })
  })

  describe('GET /health', () => {
    it('returns 200 with ok status', async () => {
      const app = await buildTestApp()
      const res = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.status).toBe('ok')
      expect(body.db).toBe('connected')
    })
  })
})
