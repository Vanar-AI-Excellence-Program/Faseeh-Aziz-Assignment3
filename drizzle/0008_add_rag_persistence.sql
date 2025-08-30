-- Add RAG persistence tables and fields for full implementation
-- This migration adds the missing pieces for complete RAG and branching support

-- Add chunkCitations field to message table for storing RAG citations
ALTER TABLE "message" ADD COLUMN "chunkCitations" jsonb;

-- Create conversationDocuments table to link uploaded documents to conversations
CREATE TABLE "conversationDocuments" (
  "id" text PRIMARY KEY NOT NULL,
  "conversationId" text NOT NULL,
  "documentId" integer NOT NULL,
  "uploadedAt" timestamp DEFAULT now() NOT NULL,
  "metadata" jsonb
);

-- Add foreign key constraints for conversationDocuments
ALTER TABLE "conversationDocuments" ADD CONSTRAINT "conversationDocuments_conversationId_chat_id_fk" 
FOREIGN KEY ("conversationId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "conversationDocuments" ADD CONSTRAINT "conversationDocuments_documentId_documents_id_fk" 
FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;

-- Create messageBranches table for tracking branch counts per message
CREATE TABLE "messageBranches" (
  "id" text PRIMARY KEY NOT NULL,
  "messageId" text NOT NULL,
  "branchCount" integer DEFAULT 0 NOT NULL,
  "lastUpdated" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint for messageBranches
ALTER TABLE "messageBranches" ADD CONSTRAINT "messageBranches_messageId_message_id_fk" 
FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX "conversationDocuments_conversationId_idx" ON "conversationDocuments" ("conversationId");
CREATE INDEX "conversationDocuments_documentId_idx" ON "conversationDocuments" ("documentId");
CREATE INDEX "messageBranches_messageId_idx" ON "messageBranches" ("messageId");
CREATE INDEX "message_chunkCitations_idx" ON "message" USING gin ("chunkCitations");

-- Add helpful comments
COMMENT ON COLUMN "message"."chunkCitations" IS 'JSON array of chunk IDs used in RAG responses for citations';
COMMENT ON TABLE "conversationDocuments" IS 'Links uploaded documents to specific conversations for RAG context';
COMMENT ON TABLE "messageBranches" IS 'Tracks how many branches exist for each message to enable branch navigation';
COMMENT ON COLUMN "messageBranches"."branchCount" IS 'Number of branches that fork from this message';

-- Initialize messageBranches for existing messages that have branches
INSERT INTO "messageBranches" ("id", "messageId", "branchCount", "lastUpdated")
SELECT 
  gen_random_uuid()::text,
  m.id,
  COALESCE(branch_counts.count, 0),
  now()
FROM "message" m
LEFT JOIN (
  SELECT 
    "parentMessageId" as message_id,
    COUNT(*) as count
  FROM "message" 
  WHERE "parentMessageId" IS NOT NULL
  GROUP BY "parentMessageId"
) branch_counts ON m.id = branch_counts.message_id
WHERE m.id IN (
  SELECT DISTINCT "parentMessageId" FROM "message" WHERE "parentMessageId" IS NOT NULL
);
