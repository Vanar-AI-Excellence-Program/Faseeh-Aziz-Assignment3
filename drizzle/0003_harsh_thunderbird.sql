ALTER TABLE "user" ADD COLUMN "hashedPassword" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "disabled" boolean DEFAULT false;