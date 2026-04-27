import { user, enrollment } from '../../db/schema.js'
import { eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '../../db/schema.js'

type Db = NodePgDatabase<typeof schema>

export async function getDashboardStats(db: Db) {
  const [[totalUsers], [pendingCount], [enrollmentsCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(user),
    db.select({ count: sql<number>`count(*)::int` }).from(user).where(eq(user.status, 'pending')),
    db.select({ count: sql<number>`count(*)::int` }).from(enrollment),
  ])

  return {
    totalUsers: totalUsers.count,
    pendingCount: pendingCount.count,
    enrollmentsCount: enrollmentsCount.count,
  }
}
