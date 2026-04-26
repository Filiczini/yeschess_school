import { db } from '../../db/index.js'
import { user, session, account, coachProfile, studentProfile } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

export interface TestUser {
  id: string
  email: string
  name: string
  role: string
  status: string
  password: string
}

/**
 * Create a test user directly in the DB (bypassing Better Auth sign-up flow).
 * This is faster for unit tests. The session will need to be created separately
 * if you want to test authenticated routes.
 */
export async function createTestUser(data: Partial<TestUser> = {}): Promise<TestUser> {
  const email = data.email ?? `test-${Date.now()}@example.com`
  const name = data.name ?? 'Test User'
  const role = data.role ?? 'student'
  const status = data.status ?? 'active'

  const result = await db.insert(user).values({
    id: crypto.randomUUID(),
    email,
    name,
    role,
    status,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()

  return {
    ...result[0],
    password: data.password ?? 'password123',
  } as TestUser
}

export async function createTestUsers(count: number, defaults: Partial<TestUser> = {}): Promise<TestUser[]> {
  const users: TestUser[] = []
  for (let i = 0; i < count; i++) {
    users.push(await createTestUser({
      ...defaults,
      email: `test-${i}-${Date.now()}@example.com`,
    }))
  }
  return users
}

export async function createTestCoach(userId: string, data: Partial<typeof coachProfile.$inferInsert> = {}) {
  const result = await db.insert(coachProfile).values({
    id: crypto.randomUUID(),
    userId,
    bio: 'Test coach bio',
    hourlyRate: 50,
    currency: 'USD',
    commissionPct: 20,
    languages: ['en'],
    specializations: ['openings'],
    isVerified: true,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  }).returning()
  return result[0]
}

export async function createTestStudentProfile(userId: string, data: Partial<typeof studentProfile.$inferInsert> = {}) {
  const result = await db.insert(studentProfile).values({
    id: crypto.randomUUID(),
    userId,
    level: 'beginner',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  }).returning()
  return result[0]
}

export async function softDeleteUser(userId: string) {
  await db.update(user)
    .set({ deletedAt: new Date(), status: 'suspended' })
    .where(eq(user.id, userId))
}
