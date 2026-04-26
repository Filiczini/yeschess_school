import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildTestApp } from '../__tests__/helpers/app.js'

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}))

import { db } from '../db/index.js'

describe('Webhook Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/webhooks/stripe', () => {
    it('accepts synthetic event and marks processed', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/stripe',
        payload: { id: 'evt_123', type: 'invoice.payment_succeeded' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.received).toBe(true)
    })

    it('returns 200 for duplicate event (idempotency)', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ eventId: 'evt_123' }])),
          })),
        })),
      } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/stripe',
        payload: { id: 'evt_123', type: 'invoice.payment_succeeded' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.received).toBe(true)
      expect(db.insert).not.toHaveBeenCalled()
    })

    it('returns 400 when id is missing', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/stripe',
        payload: { type: 'invoice.payment_succeeded' },
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Invalid Stripe payload')
    })

    it('handles unknown event type gracefully', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/stripe',
        payload: { id: 'evt_456', type: 'unknown.event' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.received).toBe(true)
    })

    it('handles subscription events', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/stripe',
        payload: { id: 'evt_sub_1', type: 'customer.subscription.updated' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.received).toBe(true)
    })
  })

  describe('POST /api/webhooks/liqpay', () => {
    it('accepts base64 payload and marks processed', async () => {
      const app = await buildTestApp()

      const data = Buffer.from(JSON.stringify({ order_id: 'ord_123', status: 'success', action: 'pay' })).toString('base64')

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/liqpay',
        payload: { data, signature: 'fake_sig' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.received).toBe(true)
    })

    it('returns 200 for duplicate order (idempotency)', async () => {
      const app = await buildTestApp()

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ eventId: 'ord_123' }])),
          })),
        })),
      } as any)

      const data = Buffer.from(JSON.stringify({ order_id: 'ord_123', status: 'success' })).toString('base64')

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/liqpay',
        payload: { data, signature: 'fake_sig' },
      })

      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.payload)
      expect(body.received).toBe(true)
      expect(db.insert).not.toHaveBeenCalled()
    })

    it('returns 400 when order_id is missing', async () => {
      const app = await buildTestApp()

      const data = Buffer.from(JSON.stringify({ status: 'success' })).toString('base64')

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/liqpay',
        payload: { data, signature: 'fake_sig' },
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Invalid LiqPay payload')
    })

    it('returns 400 for invalid base64 data', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/liqpay',
        payload: { data: '!!!not-base64!!!', signature: 'fake_sig' },
      })

      expect(res.statusCode).toBe(400)
      const body = JSON.parse(res.payload)
      expect(body.error).toContain('Invalid LiqPay payload')
    })

    it('returns 400 when body does not match schema', async () => {
      const app = await buildTestApp()

      const res = await app.inject({
        method: 'POST',
        url: '/api/webhooks/liqpay',
        payload: { data: 'abc' },
      })

      expect(res.statusCode).toBe(400)
    })
  })
})
