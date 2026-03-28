import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  uuid,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// =============================================================================
// ENUMS
// =============================================================================

// — existing —
export const roleEnum = pgEnum('role', [
  'student',
  'parent',
  'coach',
  'school_owner',
  'admin',
  'super_admin',
])
export const planEnum = pgEnum('plan', ['free', 'pro', 'elite'])
export const statusEnum = pgEnum('status', ['active', 'pending', 'suspended'])

// — new —
export const chessTitleEnum = pgEnum('chess_title', [
  'CM', 'NM', 'FM', 'IM', 'GM', 'WFM', 'WIM', 'WGM',
])

export const courseLevelEnum = pgEnum('course_level', [
  'beginner', 'intermediate', 'advanced',
])

export const contentTypeEnum = pgEnum('content_type', ['video', 'text', 'mixed'])

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded',
])

export const paymentTypeEnum = pgEnum('payment_type', [
  'subscription', 'course', 'booking', 'package', 'tournament',
])

export const paymentProviderEnum = pgEnum('payment_provider', ['stripe', 'liqpay'])

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'success', 'failed', 'refunded',
])

export const subStatusEnum = pgEnum('sub_status', [
  'active', 'past_due', 'cancelled', 'unpaid',
])

export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'paid', 'failed'])

export const tournamentStatusEnum = pgEnum('tournament_status', [
  'draft', 'registration_open', 'registration_closed',
  'ongoing', 'completed', 'cancelled',
])

export const participantStatusEnum = pgEnum('participant_status', [
  'registered', 'confirmed', 'cancelled',
])

export const accessSourceEnum = pgEnum('access_source', [
  'purchase', 'subscription', 'gift',
])

// =============================================================================
// AUTH & USERS  (Better Auth — не чіпати структуру ядра!)
// =============================================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: roleEnum('role').notNull().default('student'),
  status: statusEnum('status').notNull().default('active'),
  plan: planEnum('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  phone: text('phone'),
  contactMethod: text('contact_method'),
  instagram: text('instagram'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const lead = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// =============================================================================
// COACHES
// =============================================================================

export const coachProfile = pgTable('coach_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  title: chessTitleEnum('title'),
  fideRating: integer('fide_rating'),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('UAH'),
  commissionPct: integer('commission_pct').notNull().default(20),
  languages: text('languages')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  specializations: text('specializations')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  isVerified: boolean('is_verified').notNull().default(false),
  isVisible: boolean('is_visible').notNull().default(true),
  // Кешовані поля — оновлюються після кожного нового відгуку
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
  totalReviews: integer('total_reviews').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  isVerifiedIdx: index('coach_profiles_is_verified_idx').on(t.isVerified),
  isVisibleIdx: index('coach_profiles_is_visible_idx').on(t.isVisible),
  avgRatingIdx: index('coach_profiles_avg_rating_idx').on(t.avgRating),
}))

export const coachSchedule = pgTable('coach_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  coachId: uuid('coach_id')
    .notNull()
    .references(() => coachProfile.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Monday … 6 = Sunday
  startTime: text('start_time').notNull(),     // "09:00"
  endTime: text('end_time').notNull(),         // "18:00"
  slotDuration: integer('slot_duration').notNull().default(60), // хвилини
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  uniqueCoachDay: uniqueIndex('coach_schedules_coach_day_uidx').on(t.coachId, t.dayOfWeek),
}))

// =============================================================================
// STUDENTS
// =============================================================================

export const studentProfile = pgTable('student_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  level: courseLevelEnum('level'),
  fideRating: integer('fide_rating'),
  clubRating: integer('club_rating'),
  chesscomUsername: text('chesscom_username'),
  lichessUsername: text('lichess_username'),
  bio: text('bio'),
  birthdate: timestamp('birthdate'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  levelIdx: index('student_profiles_level_idx').on(t.level),
}))

// =============================================================================
// COURSES & LESSONS
// =============================================================================

export const course = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  coachId: uuid('coach_id')
    .notNull()
    .references(() => coachProfile.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  level: courseLevelEnum('level').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }), // null = тільки за підпискою
  isSubscriptionOnly: boolean('is_subscription_only').notNull().default(false),
  coverUrl: text('cover_url'),
  published: boolean('published').notNull().default(false),
  totalLessons: integer('total_lessons').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  coachIdx: index('courses_coach_id_idx').on(t.coachId),
  levelIdx: index('courses_level_idx').on(t.level),
  publishedIdx: index('courses_published_idx').on(t.published),
  deletedAtIdx: index('courses_deleted_at_idx').on(t.deletedAt),
}))

export const lesson = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => course.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  order: integer('order').notNull(),
  contentType: contentTypeEnum('content_type').notNull().default('video'),
  videoUrl: text('video_url'),
  content: text('content'),
  durationMin: integer('duration_min'),
  isFree: boolean('is_free').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  uniqueCourseOrder: uniqueIndex('lessons_course_order_uidx').on(t.courseId, t.order),
  deletedAtIdx: index('lessons_deleted_at_idx').on(t.deletedAt),
}))

// =============================================================================
// PAYMENTS  (оголошуємо до таблиць, що на неї посилаються)
// =============================================================================

export const payment = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  type: paymentTypeEnum('type').notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('UAH'),
  // Stripe Payment Intent ID або LiqPay order_id
  externalId: text('external_id').unique(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  userIdx: index('payments_user_id_idx').on(t.userId),
  typeIdx: index('payments_type_idx').on(t.type),
  providerIdx: index('payments_provider_idx').on(t.provider),
  statusIdx: index('payments_status_idx').on(t.status),
}))

export const subscription = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id),
  stripeSubId: text('stripe_sub_id').notNull().unique(),
  stripePriceId: text('stripe_price_id').notNull(),
  plan: planEnum('plan').notNull(),
  status: subStatusEnum('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  statusIdx: index('subscriptions_status_idx').on(t.status),
  periodEndIdx: index('subscriptions_period_end_idx').on(t.currentPeriodEnd),
}))

// =============================================================================
// COURSE ACCESS & PROGRESS
// =============================================================================

export const courseAccess = pgTable('course_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => course.id),
  paymentId: uuid('payment_id')
    .unique()
    .references(() => payment.id),
  source: accessSourceEnum('source').notNull(),
  expiresAt: timestamp('expires_at'), // null = назавжди
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  uniqueUserCourse: uniqueIndex('course_access_user_course_uidx').on(t.userId, t.courseId),
}))

export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lesson.id, { onDelete: 'cascade' }),
  courseAccessId: uuid('course_access_id')
    .notNull()
    .references(() => courseAccess.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  uniqueUserLesson: uniqueIndex('lesson_progress_user_lesson_uidx').on(t.userId, t.lessonId),
  userAccessIdx: index('lesson_progress_user_access_idx').on(t.userId, t.courseAccessId),
}))

// =============================================================================
// SESSION PACKAGES & BOOKINGS
// =============================================================================

export const sessionPackage = pgTable('session_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  coachId: uuid('coach_id')
    .notNull()
    .references(() => coachProfile.id),
  name: text('name').notNull(),
  sessionsCount: integer('sessions_count').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  discountPct: integer('discount_pct').notNull(),
  validityDays: integer('validity_days').notNull().default(90),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  coachIdx: index('session_packages_coach_id_idx').on(t.coachId),
  isActiveIdx: index('session_packages_is_active_idx').on(t.isActive),
}))

export const purchasedPackage = pgTable('purchased_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  packageId: uuid('package_id')
    .notNull()
    .references(() => sessionPackage.id),
  paymentId: uuid('payment_id')
    .notNull()
    .unique()
    .references(() => payment.id),
  sessionsTotal: integer('sessions_total').notNull(),
  sessionsUsed: integer('sessions_used').notNull().default(0),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  userIdx: index('purchased_packages_user_id_idx').on(t.userId),
  expiresAtIdx: index('purchased_packages_expires_at_idx').on(t.expiresAt),
}))

export const booking = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: text('student_id')
    .notNull()
    .references(() => user.id),
  coachId: uuid('coach_id')
    .notNull()
    .references(() => coachProfile.id),
  // Або разова оплата, або з пакету — одне з двох
  paymentId: uuid('payment_id')
    .unique()
    .references(() => payment.id),
  purchasedPackageId: uuid('purchased_package_id')
    .references(() => purchasedPackage.id),
  status: bookingStatusEnum('status').notNull().default('pending'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  durationMin: integer('duration_min').notNull().default(60),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  cancelReason: text('cancel_reason'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  studentIdx: index('bookings_student_id_idx').on(t.studentId),
  coachIdx: index('bookings_coach_id_idx').on(t.coachId),
  statusIdx: index('bookings_status_idx').on(t.status),
  scheduledAtIdx: index('bookings_scheduled_at_idx').on(t.scheduledAt),
}))

export const review = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id),
  coachId: uuid('coach_id')
    .notNull()
    .references(() => coachProfile.id),
  bookingId: uuid('booking_id')
    .notNull()
    .unique()
    .references(() => booking.id),
  rating: integer('rating').notNull(), // 1–5
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  coachIdx: index('reviews_coach_id_idx').on(t.coachId),
  ratingIdx: index('reviews_rating_idx').on(t.rating),
}))

// =============================================================================
// TOURNAMENTS
// =============================================================================

export const tournament = pgTable('tournaments', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  status: tournamentStatusEnum('status').notNull().default('draft'),
  entryFee: numeric('entry_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  maxParticipants: integer('max_participants'),
  registrationEndsAt: timestamp('registration_ends_at').notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at'),
  location: text('location'),
  coverUrl: text('cover_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  statusIdx: index('tournaments_status_idx').on(t.status),
  startsAtIdx: index('tournaments_starts_at_idx').on(t.startsAt),
  regEndsAtIdx: index('tournaments_registration_ends_at_idx').on(t.registrationEndsAt),
}))

export const tournamentParticipant = pgTable('tournament_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id')
    .notNull()
    .references(() => tournament.id),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  paymentId: uuid('payment_id')
    .unique()
    .references(() => payment.id),
  status: participantStatusEnum('status').notNull().default('registered'),
  registeredAt: timestamp('registered_at').notNull().defaultNow(),
}, (t) => ({
  uniqueTournamentUser: uniqueIndex('tournament_participants_tournament_user_uidx').on(
    t.tournamentId,
    t.userId,
  ),
}))

// =============================================================================
// PAYOUTS
// =============================================================================

export const payout = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  coachId: uuid('coach_id')
    .notNull()
    .references(() => coachProfile.id),
  grossAmount: numeric('gross_amount', { precision: 10, scale: 2 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull(),
  netAmount: numeric('net_amount', { precision: 10, scale: 2 }).notNull(),
  status: payoutStatusEnum('status').notNull().default('pending'),
  bookingId: uuid('booking_id')
    .notNull()
    .unique()
    .references(() => booking.id),
  externalRef: text('external_ref'), // ID банківського трансферу
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  coachIdx: index('payouts_coach_id_idx').on(t.coachId),
  statusIdx: index('payouts_status_idx').on(t.status),
}))

// =============================================================================
// LINK CODES  (учень генерує → батько вводить → parent_child)
// =============================================================================

export const linkCode = pgTable('link_codes', {
  code: text('code').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  studentIdx: index('link_codes_student_id_idx').on(t.studentId),
  expiresAtIdx: index('link_codes_expires_at_idx').on(t.expiresAt),
}))

// =============================================================================
// PARENTS
// =============================================================================

export const parentChild = pgTable('parent_children', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: text('parent_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  childId: text('child_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  uniqueParentChild: uniqueIndex('parent_children_parent_child_uidx').on(t.parentId, t.childId),
  parentIdx: index('parent_children_parent_id_idx').on(t.parentId),
}))

// =============================================================================
// ENROLLMENTS  (адмін призначає учня до тренера)
// =============================================================================

export const enrollment = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: text('student_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  coachId: uuid('coach_id')
    .notNull()
    .references(() => coachProfile.id, { onDelete: 'cascade' }),
  assignedBy: text('assigned_by')
    .notNull()
    .references(() => user.id), // адмін, який призначив
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  uniqueStudentCoach: uniqueIndex('enrollments_student_coach_uidx').on(t.studentId, t.coachId),
  studentIdx: index('enrollments_student_id_idx').on(t.studentId),
  coachIdx: index('enrollments_coach_id_idx').on(t.coachId),
}))
