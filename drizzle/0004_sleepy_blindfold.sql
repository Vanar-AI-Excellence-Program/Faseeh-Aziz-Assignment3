-- Enable the vector extension for pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb
);

CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"chunk_id" integer NOT NULL,
	"embedding" vector(768) NOT NULL
);

CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);

DROP TABLE "pending_user" CASCADE;
DROP TABLE "verificationToken" CASCADE;
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_chunk_id_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunks"("id") ON DELETE cascade ON UPDATE no action;

-- Create optimized index for vector similarity search
CREATE INDEX "embeddings_embedding_idx" ON "embeddings" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);