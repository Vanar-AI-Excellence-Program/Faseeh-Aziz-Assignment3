-- Migration: Add Tree Support to Message Table
-- This script adds the necessary columns for Git-like branching conversations

-- Add parentId column for tree structure
ALTER TABLE message ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- Add index for better performance on tree queries
CREATE INDEX IF NOT EXISTS idx_message_parent_id ON message("parentId");

-- Add index for chat + parent queries
CREATE INDEX IF NOT EXISTS idx_message_chat_parent ON message("chatId", "parentId");

-- Update existing messages to have no parent (root messages)
UPDATE message SET "parentId" = NULL WHERE "parentId" IS NULL;

-- Add comment to document the tree structure
COMMENT ON COLUMN message."parentId" IS 'References message.id for tree structure. NULL means root message.';
