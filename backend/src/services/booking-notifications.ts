import { user, coachProfile } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '../db/schema.js'
import { sendBookingConfirmed, sendBookingCancelled } from '../email.js'

type Db = NodePgDatabase<typeof schema>

export async function notifyBookingStatusChange(
  db: Db,
  {
    status,
    studentId,
    coachProfileId,
    scheduledAt,
    durationMin,
    cancelReason,
  }: {
    status: string
    studentId: string
    coachProfileId: string
    scheduledAt: Date
    durationMin: number
    cancelReason?: string | null
  }
) {
  if (status !== 'confirmed' && status !== 'cancelled') return

  const coachUserAlias = alias(user, 'coach_user_email')
  const [studentRow] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, studentId))
  const [coachRow] = await db
    .select({ name: coachUserAlias.name })
    .from(coachProfile)
    .innerJoin(coachUserAlias, eq(coachProfile.userId, coachUserAlias.id))
    .where(eq(coachProfile.id, coachProfileId))

  if (!studentRow || !coachRow) return

  if (status === 'confirmed') {
    await sendBookingConfirmed(
      studentRow.email,
      studentRow.name,
      coachRow.name,
      scheduledAt,
      durationMin,
    )
  } else {
    await sendBookingCancelled(
      studentRow.email,
      studentRow.name,
      coachRow.name,
      scheduledAt,
      cancelReason,
    )
  }
}
