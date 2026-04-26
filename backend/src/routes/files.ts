import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/auth.js'

// ── MinIO / S3 presigned URL architecture ──────────────────────────────────────
//
//  Security rules:
//  1. Presigned URLs are generated ONLY on the backend.
//  2. File ownership is checked before any URL is issued.
//  3. TTL is capped at 1 hour (3600 seconds).
//  4. MinIO / S3 credentials NEVER leave the backend.
//
//  Installation (when needed):
//    npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
//
//  Environment:
//    S3_ENDPOINT=http://localhost:9000
//    S3_BUCKET=yeschess-uploads
//    S3_ACCESS_KEY=...
//    S3_SECRET_KEY=...
//    S3_REGION=us-east-1
//
// ────────────────────────────────────────────────────────────────────────────────

// import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// const s3 = new S3Client({
//   endpoint: process.env.S3_ENDPOINT,
//   region: process.env.S3_REGION ?? 'us-east-1',
//   credentials: {
//     accessKeyId: process.env.S3_ACCESS_KEY!,
//     secretAccessKey: process.env.S3_SECRET_KEY!,
//   },
//   forcePathStyle: true,
// })
// const BUCKET = process.env.S3_BUCKET!
const PRESIGN_TTL_SECONDS = 3600

function userKeyPrefix(userId: string, category: string) {
  return `${category}/${userId}`
}

export default async function fileRoutes(app: FastifyInstance) {
  // ── POST /api/files/presigned-upload ─────────────────────────────────────────
  // Generates a presigned PUT URL so the frontend can upload directly to S3/MinIO.
  // The object key is scoped to the authenticated user to prevent overwrites.
  app.post('/api/files/presigned-upload', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Files'],
      summary: 'Отримати presigned URL для завантаження файлу',
      description:
        'Генерує підписаний PUT URL для прямого завантаження в S3/MinIO. ' +
        `Термін дії — ${PRESIGN_TTL_SECONDS} секунд. Ключ файлу прив'язаний до userId.`,
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['filename', 'contentType'],
        properties: {
          filename: { type: 'string', minLength: 1, maxLength: 255, description: 'Ім\'я файлу (без шляху)' },
          contentType: { type: 'string', description: 'MIME-тип файлу, наприклад image/jpeg' },
          category: { type: 'string', enum: ['avatars', 'documents', 'attachments'], default: 'attachments' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            uploadUrl: { type: 'string', format: 'uri', description: 'Presigned PUT URL' },
            objectKey: { type: 'string', description: 'Повний ключ об\'єкта в бакеті' },
            publicUrl: { type: 'string', format: 'uri', description: 'Публічний URL після завантаження (якщо бакет публічний)' },
            expiresAt: { type: 'string', format: 'date-time', description: 'Час закінчення дії URL' },
          },
        },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const { filename, contentType, category = 'attachments' } = req.body as {
      filename: string
      contentType: string
      category?: string
    }

    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_')
    if (!sanitized || sanitized.length > 255) {
      return reply.status(400).send({ error: 'Invalid filename' })
    }

    const prefix = userKeyPrefix(req.session.user.id, category)
    const objectKey = `${prefix}/${Date.now()}-${sanitized}`
    const expiresAt = new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000)

    // ── Placeholder: replace with real S3/MinIO presigner ───────────────────────
    // const command = new PutObjectCommand({
    //   Bucket: BUCKET,
    //   Key: objectKey,
    //   ContentType: contentType,
    // })
    // const uploadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_TTL_SECONDS })

    const uploadUrl = `https://placeholder-presigned-url/${objectKey}?expires=${expiresAt.toISOString()}`
    const publicUrl = `${process.env.S3_PUBLIC_URL_PREFIX ?? `https://placeholder-cdn`}/${objectKey}`

    return reply.send({ uploadUrl, objectKey, publicUrl, expiresAt })
  })

  // ── GET /api/files/presigned-download/:key ───────────────────────────────────
  // Generates a presigned GET URL for a file the user owns or has access to.
  app.get('/api/files/presigned-download/:key', {
    preHandler: [requireAuth],
    schema: {
      tags: ['Files'],
      summary: 'Отримати presigned URL для завантаження файлу',
      description:
        'Генерує підписаний GET URL для скачування файлу. ' +
        'Перевіряє право доступу (власник файлу або співробітник).',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['key'],
        properties: {
          key: { type: 'string', description: 'Повний ключ об\'єкта в бакеті' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            downloadUrl: { type: 'string', format: 'uri', description: 'Presigned GET URL' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        400: { $ref: 'Error#' },
        401: { $ref: 'Error#' },
        403: { $ref: 'Error#' },
        404: { $ref: 'Error#' },
      },
    },
  }, async (req, reply) => {
    const { key } = req.params as { key: string }

    if (!key || key.includes('..') || key.startsWith('/')) {
      return reply.status(400).send({ error: 'Invalid key' })
    }

    // Ownership check: key must start with the user's own prefix, or user is admin/coach
    const userPrefix = userKeyPrefix(req.session.user.id, '')
    const isAdmin = ['admin', 'super_admin'].includes(req.session.user.role ?? '')
    const isOwner = key.startsWith(userPrefix)

    if (!isOwner && !isAdmin) {
      return reply.status(403).send({ error: 'Access denied to this file' })
    }

    const expiresAt = new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000)

    // ── Placeholder: replace with real S3/MinIO presigner ───────────────────────
    // const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    // const downloadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_TTL_SECONDS })

    const downloadUrl = `https://placeholder-presigned-url/${key}?expires=${expiresAt.toISOString()}`

    return reply.send({ downloadUrl, expiresAt })
  })
}
