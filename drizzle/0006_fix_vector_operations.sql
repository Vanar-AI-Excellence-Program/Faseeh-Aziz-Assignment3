-- Fix vector operations and ensure proper indexing
-- Enable the vector extension for pgvector (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop and recreate the embeddings table with proper vector type
DROP TABLE IF EXISTS "embeddings" CASCADE;

CREATE TABLE "embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"chunk_id" integer NOT NULL,
	"embedding" vector(768) NOT NULL
);

-- Recreate foreign key constraint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_chunk_id_chunks_id_fk" 
FOREIGN KEY ("chunk_id") REFERENCES "chunks"("id") ON DELETE cascade ON UPDATE no action;

-- Create optimized index for vector similarity search
CREATE INDEX "embeddings_embedding_idx" ON "embeddings" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index on chunk_id for faster joins
CREATE INDEX "embeddings_chunk_id_idx" ON "embeddings" ("chunk_id");

-- Add some helpful comments
COMMENT ON TABLE "embeddings" IS 'Stores vector embeddings for text chunks to enable semantic search';
COMMENT ON COLUMN "embeddings"."embedding" IS '768-dimensional vector embedding for semantic similarity search';
