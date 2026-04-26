import 'dotenv/config'
import Fastify, { type FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from './db/index.js'

import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import coachRoutes from './routes/coach.js'
import bookingsRoutes from './routes/bookings.js'
import studentRoutes from './routes/student.js'
import parentRoutes from './routes/parent.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'
import webhookRoutes from './routes/webhooks.js'
import fileRoutes from './routes/files.js'

// ── Startup validation ────────────────────────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'FRONTEND_URL'] as const
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    process.stderr.write(`Missing required env var: ${key}\n`)
    process.exit(1)
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      keywords: ['example'],
    },
  },
})

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req: FastifyRequest) => {
    const forwarded = req.headers['x-forwarded-for']
    const realIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip
    return realIp ?? 'unknown'
  },
  errorResponseBuilder: () => {
    const err = new Error('Too many requests') as any
    err.statusCode = 429
    return err
  },
})

await app.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'YesChess API',
      description: 'REST API для школи шахів YesChess. Сесійна аутентифікація через cookie (Better Auth).',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey' as const,
          in: 'cookie',
          name: 'better-auth.session_token',
          description: 'Сесійний cookie, встановлюється автоматично після POST /api/auth/sign-in/email',
        },
      },
    },
    security: [{ cookieAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Аутентифікація (Better Auth)' },
      { name: 'Users', description: 'Поточний користувач' },
      { name: 'Coach', description: 'Профіль та розклад тренера' },
      { name: 'Schedule', description: 'Розклад та бронювання занять' },
      { name: 'Student', description: 'Профіль учня та його заняття' },
      { name: 'Admin', description: 'Адміністрування (admin / super_admin)' },
      { name: 'Enrollments', description: 'Призначення учнів до тренерів' },
      { name: 'Parent', description: 'Управління дітьми батька/матері' },
      { name: 'Public', description: 'Публічні ендпоінти без авторизації' },
  { name: 'Files', description: 'Завантаження та скачування файлів (presigned URLs)' },
    ],
  },
})

await app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'list', deepLinking: true },
  staticCSP: true,
})

app.addSchema({
  $id: 'Error',
  type: 'object',
  properties: { error: { type: 'string' } },
})

// ── Routes ────────────────────────────────────────────────────────────────────
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

// ── Start ─────────────────────────────────────────────────────────────────────
try {
  await migrate(db, { migrationsFolder: './drizzle' })
  await app.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.stderr.write('STARTUP ERROR: ' + String(err) + '\n')
  process.exit(1)
}
