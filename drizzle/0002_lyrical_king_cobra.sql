ALTER TABLE "verification_token" RENAME TO "verificationToken";--> statement-breakpoint
ALTER TABLE "verificationToken" DROP CONSTRAINT "verification_token_identifier_token_pk";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token");--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isActive" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "firstName";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "lastName";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "hashedPassword";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "disabled";