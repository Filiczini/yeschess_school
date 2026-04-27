import {
  user,
  coachProfile,
  enrollment,
  parentChild,
  linkCode,
  booking,
  account,
  session as sessionTable,
  studentProfile,
} from '../../db/schema.js'
import { eq, and, isNull, isNotNull, inArray, sql, asc } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '../../db/schema.js'

type Db = NodePgDatabase<typeof schema>

export async function listUsers(
  db: Db,
  {
    role,
    deleted,
    page,
    limit,
  }: {
    role?: string
    deleted?: boolean
    page: number
    limit: number
  }
) {
  const offset = (page - 1) * limit
  const baseFilter = deleted ? isNotNull(user.deletedAt) : isNull(user.deletedAt)
  const filter = role ? and(baseFilter, eq(user.role, role as typeof user.role._.data)) : baseFilter

  const [[{ total }], data] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(user).where(filter),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        plan: user.plan,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
      })
      .from(user)
      .where(filter)
      .orderBy(asc(user.createdAt))
      .limit(limit)
      .offset(offset),
  ])

  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export async function softDeleteUser(db: Db, id: string) {
  await db
    .update(user)
    .set({ deletedAt: new Date(), status: 'suspended', updatedAt: new Date() })
    .where(eq(user.id, id))
  return { ok: true }
}

export async function restoreUser(db: Db, id: string) {
  await db
    .update(user)
    .set({ deletedAt: null, status: 'active', updatedAt: new Date() })
    .where(eq(user.id, id))
  return { ok: true }
}

export async function permanentDeleteUsers(db: Db, ids: string[]) {
  await db.transaction(async tx => {
    await tx.delete(parentChild).where(inArray(parentChild.parentId, ids))
    await tx.delete(parentChild).where(inArray(parentChild.childId, ids))
    await tx.delete(linkCode).where(inArray(linkCode.studentId, ids))
    await tx.delete(booking).where(inArray(booking.studentId, ids))
    await tx.delete(enrollment).where(inArray(enrollment.studentId, ids))
    await tx.delete(studentProfile).where(inArray(studentProfile.userId, ids))
    await tx.delete(coachProfile).where(inArray(coachProfile.userId, ids))
    await tx.delete(account).where(inArray(account.userId, ids))
    await tx.delete(sessionTable).where(inArray(sessionTable.userId, ids))
    await tx.delete(user).where(inArray(user.id, ids))
  })
  return { ok: true, deleted: ids.length }
}
