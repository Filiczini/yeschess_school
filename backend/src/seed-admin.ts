import 'dotenv/config'
import { auth } from './auth.js'
import { db } from './db/index.js'
import { user } from './db/schema.js'
import { eq } from 'drizzle-orm'

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME ?? 'Admin'

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are required')
    process.exit(1)
  }

  const existing = await db.select().from(user).where(eq(user.email, email))

  if (existing.length > 0) {
    await db.update(user).set({ role: 'super_admin', status: 'active' }).where(eq(user.email, email))
    console.log(`Super admin role set for existing user: ${email}`)
  } else {
    await auth.api.signUpEmail({
      body: { email, password, name },
    })

    await db.update(user).set({ role: 'super_admin', status: 'active' }).where(eq(user.email, email))
    console.log(`Super admin created: ${email}`)
  }

  process.exit(0)
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
