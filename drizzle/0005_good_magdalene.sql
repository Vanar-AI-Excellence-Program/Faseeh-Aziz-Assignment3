-- Add columns as nullable first to handle existing data
ALTER TABLE "chunks" ADD COLUMN "order" integer;
ALTER TABLE "documents" ADD COLUMN "uploaded_by" text;

-- Update existing data with default values
UPDATE "chunks" SET "order" = 0 WHERE "order" IS NULL;
UPDATE "documents" SET "uploaded_by" = (SELECT id FROM "user" LIMIT 1) WHERE "uploaded_by" IS NULL;

-- Make columns NOT NULL after updating data
ALTER TABLE "chunks" ALTER COLUMN "order" SET NOT NULL;
ALTER TABLE "documents" ALTER COLUMN "uploaded_by" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;