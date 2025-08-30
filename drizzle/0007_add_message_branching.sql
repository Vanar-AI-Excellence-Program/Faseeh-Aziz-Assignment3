-- Create proper branching system with dedicated branches table
-- This migration safely handles existing data without loss

-- Create the branches table
CREATE TABLE "branch" (
  "id" text PRIMARY KEY NOT NULL,
  "chatId" text NOT NULL,
  "name" text,
  "parentBranchId" text,
  "isActive" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints for branches
ALTER TABLE "branch" ADD CONSTRAINT "branch_chatId_chat_id_fk" 
FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;

-- Create a default branch for each existing chat
INSERT INTO "branch" ("id", "chatId", "name", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "chatId",
  'Main Branch',
  true,
  now(),
  now()
FROM (
  SELECT DISTINCT "chatId" FROM "message"
) AS existing_chats;

-- Add the new branchId column to message table (nullable first)
ALTER TABLE "message" ADD COLUMN "branchId" text;

-- Update existing messages to use the default branch
UPDATE "message" 
SET "branchId" = (
  SELECT "id" FROM "branch" 
  WHERE "branch"."chatId" = "message"."chatId" 
  AND "branch"."isActive" = true
);

-- Now make branchId NOT NULL
ALTER TABLE "message" ALTER COLUMN "branchId" SET NOT NULL;

-- Add foreign key constraint for branchId
ALTER TABLE "message" ADD CONSTRAINT "message_branchId_branch_id_fk" 
FOREIGN KEY ("branchId") REFERENCES "public"."branch"("id") ON DELETE cascade ON UPDATE no action;

-- Rename the old parentId column to parentMessageId for clarity
ALTER TABLE "message" RENAME COLUMN "parentId" TO "parentMessageId";

-- Create indexes for better performance
CREATE INDEX "branch_chatId_idx" ON "branch" ("chatId");
CREATE INDEX "branch_parentBranchId_idx" ON "branch" ("parentBranchId");
CREATE INDEX "branch_isActive_idx" ON "branch" ("isActive");
CREATE INDEX "message_branchId_idx" ON "message" ("branchId");
CREATE INDEX "message_parentMessageId_idx" ON "message" ("parentMessageId");
CREATE INDEX "message_chat_branch_idx" ON "message" ("chatId", "branchId");

-- Add helpful comments
COMMENT ON TABLE "branch" IS 'Manages conversation branches for each chat';
COMMENT ON COLUMN "branch"."parentBranchId" IS 'References another branch.id to create branch hierarchy. NULL means root branch.';
COMMENT ON COLUMN "branch"."isActive" IS 'Only one branch can be active per chat at a time';
COMMENT ON TABLE "message" IS 'Stores chat messages, each belonging to a specific branch';
COMMENT ON COLUMN "message"."branchId" IS 'References branch.id - each message belongs to exactly one branch';
COMMENT ON COLUMN "message"."parentMessageId" IS 'References message.id for threading within a branch. NULL means root message in branch.';
