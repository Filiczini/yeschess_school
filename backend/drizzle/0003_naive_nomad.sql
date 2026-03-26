CREATE TYPE "public"."access_source" AS ENUM('purchase', 'subscription', 'gift');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."chess_title" AS ENUM('CM', 'NM', 'FM', 'IM', 'GM', 'WFM', 'WIM', 'WGM');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('video', 'text', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."course_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."participant_status" AS ENUM('registered', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'liqpay');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('subscription', 'course', 'booking', 'package', 'tournament');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sub_status" AS ENUM('active', 'past_due', 'cancelled', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"coach_id" uuid NOT NULL,
	"payment_id" uuid,
	"purchased_package_id" uuid,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"notes" text,
	"cancel_reason" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "coach_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"bio" text,
	"title" "chess_title",
	"fide_rating" integer,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'UAH' NOT NULL,
	"commission_pct" integer DEFAULT 20 NOT NULL,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"specializations" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"avg_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coach_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "coach_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_duration" integer DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"level" "course_level" NOT NULL,
	"price" numeric(10, 2),
	"is_subscription_only" boolean DEFAULT false NOT NULL,
	"cover_url" text,
	"published" boolean DEFAULT false NOT NULL,
	"total_lessons" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "course_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"payment_id" uuid,
	"source" "access_source" NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_access_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order" integer NOT NULL,
	"content_type" "content_type" DEFAULT 'video' NOT NULL,
	"video_url" text,
	"content" text,
	"duration_min" integer,
	"is_free" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"course_access_id" uuid NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "payment_type" NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'UAH' NOT NULL,
	"external_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"gross_amount" numeric(10, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"booking_id" uuid NOT NULL,
	"external_ref" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "purchased_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"package_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"sessions_total" integer NOT NULL,
	"sessions_used" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchased_packages_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text NOT NULL,
	"coach_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "reviews_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "session_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sessions_count" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"discount_pct" integer NOT NULL,
	"validity_days" integer DEFAULT 90 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"stripe_sub_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"plan" "plan" NOT NULL,
	"status" "sub_status" DEFAULT 'active' NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_stripe_sub_id_unique" UNIQUE("stripe_sub_id")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"status" "tournament_status" DEFAULT 'draft' NOT NULL,
	"entry_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"max_participants" integer,
	"registration_ends_at" timestamp NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"location" text,
	"cover_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"payment_id" uuid,
	"status" "participant_status" DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_participants_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_coach_id_coach_profiles_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_purchased_package_id_purchased_packages_id_fk" FOREIGN KEY ("purchased_package_id") REFERENCES "public"."purchased_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_profiles" ADD CONSTRAINT "coach_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_schedules" ADD CONSTRAINT "coach_schedules_coach_id_coach_profiles_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_coach_id_coach_profiles_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_access" ADD CONSTRAINT "course_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_access" ADD CONSTRAINT "course_access_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_access" ADD CONSTRAINT "course_access_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_course_access_id_course_access_id_fk" FOREIGN KEY ("course_access_id") REFERENCES "public"."course_access"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_coach_id_coach_profiles_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_packages" ADD CONSTRAINT "purchased_packages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_packages" ADD CONSTRAINT "purchased_packages_package_id_session_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."session_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_packages" ADD CONSTRAINT "purchased_packages_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_coach_id_coach_profiles_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_packages" ADD CONSTRAINT "session_packages_coach_id_coach_profiles_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_student_id_idx" ON "bookings" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "bookings_coach_id_idx" ON "bookings" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_scheduled_at_idx" ON "bookings" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "coach_profiles_is_verified_idx" ON "coach_profiles" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "coach_profiles_is_visible_idx" ON "coach_profiles" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX "coach_profiles_avg_rating_idx" ON "coach_profiles" USING btree ("avg_rating");--> statement-breakpoint
CREATE UNIQUE INDEX "coach_schedules_coach_day_uidx" ON "coach_schedules" USING btree ("coach_id","day_of_week");--> statement-breakpoint
CREATE INDEX "courses_coach_id_idx" ON "courses" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "courses_level_idx" ON "courses" USING btree ("level");--> statement-breakpoint
CREATE INDEX "courses_published_idx" ON "courses" USING btree ("published");--> statement-breakpoint
CREATE INDEX "courses_deleted_at_idx" ON "courses" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "course_access_user_course_uidx" ON "course_access" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_course_order_uidx" ON "lessons" USING btree ("course_id","order");--> statement-breakpoint
CREATE INDEX "lessons_deleted_at_idx" ON "lessons" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_progress_user_lesson_uidx" ON "lesson_progress" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_user_access_idx" ON "lesson_progress" USING btree ("user_id","course_access_id");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_type_idx" ON "payments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "payments_provider_idx" ON "payments" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payouts_coach_id_idx" ON "payouts" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "purchased_packages_user_id_idx" ON "purchased_packages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "purchased_packages_expires_at_idx" ON "purchased_packages" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "reviews_coach_id_idx" ON "reviews" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "session_packages_coach_id_idx" ON "session_packages" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "session_packages_is_active_idx" ON "session_packages" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_period_end_idx" ON "subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "tournaments_status_idx" ON "tournaments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tournaments_starts_at_idx" ON "tournaments" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "tournaments_registration_ends_at_idx" ON "tournaments" USING btree ("registration_ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_participants_tournament_user_uidx" ON "tournament_participants" USING btree ("tournament_id","user_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_stripe_customer_id_unique" UNIQUE("stripe_customer_id");