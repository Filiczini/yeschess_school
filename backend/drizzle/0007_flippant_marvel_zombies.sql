CREATE TABLE "parent_children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" text NOT NULL,
	"child_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parent_children" ADD CONSTRAINT "parent_children_parent_id_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_children" ADD CONSTRAINT "parent_children_child_id_user_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "parent_children_parent_child_uidx" ON "parent_children" USING btree ("parent_id","child_id");--> statement-breakpoint
CREATE INDEX "parent_children_parent_id_idx" ON "parent_children" USING btree ("parent_id");