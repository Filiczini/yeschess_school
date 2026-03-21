import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db/index.js'
import * as schema from './db/schema.js'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'student',
        input: false,
      },
      plan: {
        type: 'string',
        required: false,
        defaultValue: 'free',
        input: false,
      },
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:5173'],
})

export type Auth = typeof auth
