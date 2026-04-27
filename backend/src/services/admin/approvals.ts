import { user } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '../../db/schema.js'

type Db = NodePgDatabase<typeof schema>

export async function listPendingUsers(db: Db) {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.status, 'pending'))
}

export async function approveUser(db: Db, id: string) {
  await db.update(user).set({ status: 'active' }).where(eq(user.id, id))
  return { ok: true }
}

export async function rejectUser(db: Db, id: string) {
  await db.update(user).set({ role: 'student', status: 'active' }).where(eq(user.id, id))
  return { ok: true }
}
