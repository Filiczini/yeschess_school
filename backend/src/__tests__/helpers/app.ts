import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'

import authRoutes from '../../routes/auth.js'
import usersRoutes from '../../routes/users.js'
import coachRoutes from '../../routes/coach.js'
import bookingsRoutes from '../../routes/bookings.js'
import studentRoutes from '../../routes/student.js'
import parentRoutes from '../../routes/parent.js'
import adminRoutes from '../../routes/admin.js'
import publicRoutes from '../../routes/public.js'
import webhookRoutes from '../../routes/webhooks.js'
import fileRoutes from '../../routes/files.js'

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    ajv: {
      customOptions: {
        keywords: ['example'],
      },
    },
  })

  await app.register(cors, {
    origin: 'http://localhost:5173',
    credentials: true,
  })

  // Disable rate limits in tests (use high limits)
  await app.register(rateLimit, {
    global: true,
    max: 10000,
    timeWindow: '1 minute',
  })

  // Add shared schema definitions before routes register them
  app.addSchema({
    $id: 'Error',
    type: 'object',
    properties: {
      error: { type: 'string' },
    },
  })

  await app.register(authRoutes)
  await app.register(usersRoutes)
  await app.register(coachRoutes)
  await app.register(bookingsRoutes)
  await app.register(studentRoutes)
  await app.register(parentRoutes)
  await app.register(adminRoutes)
  await app.register(publicRoutes)
  await app.register(webhookRoutes)
  await app.register(fileRoutes)

  return app
}
