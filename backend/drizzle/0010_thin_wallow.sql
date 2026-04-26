CREATE TABLE "processed_webhooks" (
	"event_id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_type" text,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
