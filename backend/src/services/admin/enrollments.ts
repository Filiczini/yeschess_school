import { user, coachProfile, enrollment } from '../../db/schema.js'
import { eq, and, asc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '../../db/schema.js'

type Db = NodePgDatabase<typeof schema>

export async function listEnrollments(
  db: Db,
  { page, limit }: { page: number; limit: number }
) {
  const offset = (page - 1) * limit
  const studentUser = alias(user, 'student_user')
  const coachUser = alias(user, 'coach_user')

  const baseQuery = db
    .select({
      id: enrollment.id,
      notes: enrollment.notes,
      createdAt: enrollment.createdAt,
      studentId: enrollment.studentId,
      studentName: studentUser.name,
      studentEmail: studentUser.email,
      coachId: enrollment.coachId,
      coachName: coachUser.name,
    })
    .from(enrollment)
    .innerJoin(studentUser, eq(enrollment.studentId, studentUser.id))
    .innerJoin(coachProfile, eq(enrollment.coachId, coachProfile.id))
    .innerJoin(coachUser, eq(coachProfile.userId, coachUser.id))

  const [[{ total }], data] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(enrollment)
      .innerJoin(studentUser, eq(enrollment.studentId, studentUser.id))
      .innerJoin(coachProfile, eq(enrollment.coachId, coachProfile.id))
      .innerJoin(coachUser, eq(coachProfile.userId, coachUser.id)),
    baseQuery.orderBy(asc(enrollment.createdAt)).limit(limit).offset(offset),
  ])

  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export async function createEnrollment(
  db: Db,
  {
    studentId,
    coachId,
    notes,
    assignedBy,
  }: {
    studentId: string
    coachId: string
    notes?: string
    assignedBy: string
  }
) {
  const [existing] = await db
    .select({ id: enrollment.id })
    .from(enrollment)
    .where(and(eq(enrollment.studentId, studentId), eq(enrollment.coachId, coachId)))

  if (existing) {
    const error = new Error('Enrollment already exists')
    // @ts-expect-error attach status code
    error.statusCode = 409
    throw error
  }

  const [created] = await db
    .insert(enrollment)
    .values({ studentId, coachId, assignedBy, notes })
    .returning({ id: enrollment.id })

  return { id: created.id }
}

export async function deleteEnrollment(db: Db, id: string) {
  await db.delete(enrollment).where(eq(enrollment.id, id))
  return { ok: true }
}
