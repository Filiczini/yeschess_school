import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db } from '../db/index.js'
import { processedWebhook } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { createHmac } from 'node:crypto'

// ── Idempotency guard ───────────────────────────────────────────────────────
async function isDuplicate(eventId: string) {
  const [row] = await db
    .select({ eventId: processedWebhook.eventId })
    .from(processedWebhook)
    .where(eq(processedWebhook.eventId, eventId))
    .limit(1)
  return !!row
}

async function markProcessed(eventId: string, provider: string, eventType?: string) {
  await db
    .insert(processedWebhook)
    .values({ eventId, provider, eventType: eventType ?? null })
    .onConflictDoNothing({ target: processedWebhook.eventId })
}

// ── Stripe signature verification placeholder ─────────────────────────────────
// In production:
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' })
// const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
function verifyStripeSignature(_rawBody: string, _signature: string, _secret: string): { id: string; type: string } | null {
  // TODO: implement after Stripe SDK is installed
  return null
}

// ── LiqPay signature verification placeholder ─────────────────────────────────
// LiqPay sends data + signature in base64. Signature = base64( sha1( private_key + data + private_key ) )
function verifyLiqPaySignature(_data: string, _signature: string, _privateKey: string): { id: string; type: string } | null {
  // TODO: implement when LiqPay integration is wired up
  return null
}

// ── Routes ────────────────────────────────────────────────────────────────────
export default async function webhookRoutes(app: FastifyInstance) {
  // Stripe webhook
  app.post('/api/webhooks/stripe', {
    config: { rawBody: true },
    schema: {
      tags: ['Webhooks'],
      summary: 'Stripe webhook (placeholder)',
      security: [],
      response: {
        200: { type: 'object', properties: { received: { type: 'boolean' } } },
        400: { $ref: 'Error#' },
        409: { description: 'Duplicate event', type: 'object', properties: { received: { type: 'boolean' } } },
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const signature = (req.headers['stripe-signature'] as string) ?? ''
    const rawBody = (req as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(req.body)
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

    const event = verifyStripeSignature(rawBody, signature, secret)
    if (!event) {
      // During development without real signatures, accept synthetic events
      // Remove this fallback before going live!
      const body = req.body as { id?: string; type?: string } | undefined
      if (!body?.id) return reply.status(400).send({ error: 'Invalid Stripe payload' })
      if (await isDuplicate(body.id)) {
        return reply.status(200).send({ received: true })
      }
      // Placeholder handlers
      switch (body.type) {
        case 'invoice.payment_succeeded':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          // TODO: sync subscription status to DB
          break
        default:
          break
      }
      await markProcessed(body.id, 'stripe', body.type)
      return reply.send({ received: true })
    }

    if (await isDuplicate(event.id)) {
      return reply.status(200).send({ received: true })
    }

    switch (event.type) {
      case 'invoice.payment_succeeded':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // TODO: sync subscription status to DB
        break
      default:
        break
    }

    await markProcessed(event.id, 'stripe', event.type)
    return reply.send({ received: true })
  })

  // LiqPay webhook
  app.post('/api/webhooks/liqpay', {
    schema: {
      tags: ['Webhooks'],
      summary: 'LiqPay webhook (placeholder)',
      security: [],
      body: {
        type: 'object',
        required: ['data', 'signature'],
        properties: {
          data: { type: 'string', description: 'Base64-encoded JSON payload' },
          signature: { type: 'string', description: 'Base64-encoded SHA1 signature' },
        },
      },
      response: {
        200: { type: 'object', properties: { received: { type: 'boolean' } } },
        400: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const { data, signature } = req.body as { data: string; signature: string }
    const privateKey = process.env.LIQPAY_PRIVATE_KEY ?? ''

    const event = verifyLiqPaySignature(data, signature, privateKey)
    if (!event) {
      // Development fallback
      try {
        const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8')) as { order_id?: string; status?: string; action?: string }
        if (!decoded.order_id) return reply.status(400).send({ error: 'Invalid LiqPay payload' })
        if (await isDuplicate(decoded.order_id)) {
          return reply.status(200).send({ received: true })
        }
        // TODO: update payment record by order_id
        await markProcessed(decoded.order_id, 'liqpay', decoded.status)
        return reply.send({ received: true })
      } catch {
        return reply.status(400).send({ error: 'Invalid LiqPay payload' })
      }
    }

    if (await isDuplicate(event.id)) {
      return reply.status(200).send({ received: true })
    }

    // TODO: update payment record by order_id
    await markProcessed(event.id, 'liqpay', event.type)
    return reply.send({ received: true })
  })
}
