import { db } from '../db/index.js'
import { coachProfile } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export async function getCoachProfile(userId: string) {
  const [profile] = await db
    .select({ id: coachProfile.id })
    .from(coachProfile)
    .where(eq(coachProfile.userId, userId))
  return profile ?? null
}
