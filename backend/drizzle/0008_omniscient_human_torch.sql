CREATE TABLE "link_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "link_codes" ADD CONSTRAINT "link_codes_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_codes_student_id_idx" ON "link_codes" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "link_codes_expires_at_idx" ON "link_codes" USING btree ("expires_at");