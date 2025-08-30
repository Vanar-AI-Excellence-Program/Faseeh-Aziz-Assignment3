CREATE TABLE "branch" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"name" text,
	"parentBranchId" text,
	"isActive" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversationDocuments" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"documentId" integer NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "messageBranches" (
	"id" text PRIMARY KEY NOT NULL,
	"messageId" text NOT NULL,
	"branchCount" integer DEFAULT 0 NOT NULL,
	"lastUpdated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "embeddings" ALTER COLUMN "embedding" SET DATA TYPE vector(768);--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "chunkCitations" jsonb;--> statement-breakpoint
ALTER TABLE "branch" ADD CONSTRAINT "branch_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversationDocuments" ADD CONSTRAINT "conversationDocuments_conversationId_chat_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversationDocuments" ADD CONSTRAINT "conversationDocuments_documentId_documents_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messageBranches" ADD CONSTRAINT "messageBranches_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;