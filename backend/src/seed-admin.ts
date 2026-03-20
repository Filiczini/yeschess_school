import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'
import { Pool } from 'pg'

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are required')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const existing = await db.select().from(users).where(eq(users.email, email))

  if (existing.length > 0) {
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.email, email))
    console.log(`Admin password updated: ${email}`)
  } else {
    await db.insert(users).values({ email, passwordHash, role: 'admin' })
    console.log(`Admin created: ${email}`)
  }

  process.exit(0)
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
