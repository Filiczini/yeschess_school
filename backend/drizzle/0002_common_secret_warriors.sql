CREATE TYPE "public"."status" AS ENUM('active', 'pending', 'suspended');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" "status" DEFAULT 'active' NOT NULL;