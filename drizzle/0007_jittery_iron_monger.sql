CREATE TABLE "conversation_branch" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"rootMessageId" text NOT NULL,
	"branchName" text,
	"description" text,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"messageId" text NOT NULL,
	"tag" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "isEdited" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "editHistory" jsonb;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_branch" ADD CONSTRAINT "conversation_branch_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_branch" ADD CONSTRAINT "conversation_branch_rootMessageId_message_id_fk" FOREIGN KEY ("rootMessageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_tag" ADD CONSTRAINT "message_tag_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_parentId_message_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;