ALTER TYPE "public"."role" ADD VALUE 'parent' BEFORE 'coach';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'school_owner' BEFORE 'admin';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'super_admin';