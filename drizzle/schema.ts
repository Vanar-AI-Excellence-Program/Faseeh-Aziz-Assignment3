import { pgTable, foreignKey, text, timestamp, boolean, unique, index, integer, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const chat = pgTable("chat", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "chat_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const chatMessages = pgTable("chat_messages", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	conversationId: text("conversation_id").notNull(),
	parentMessageId: text("parent_message_id"),
	originalMessageId: text("original_message_id"),
	role: text().notNull(),
	content: text().notNull(),
	chunkCitations: text("chunk_citations"),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "chat_messages_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const message = pgTable("message", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	conversationId: text("conversation_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "message_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const chatBranches = pgTable("chat_branches", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	conversationId: text("conversation_id").notNull(),
	parentBranchId: text("parent_branch_id"),
	branchName: text("branch_name").default('Main').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "chat_branches_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	role: text().default('user'),
	isActive: boolean().default(true),
	hashedPassword: text(),
	disabled: boolean().default(false),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const messageBranches = pgTable("message_branches", {
	messageId: text("message_id").notNull(),
	branchId: text("branch_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	id: text().primaryKey().notNull(),
	conversationId: text("conversation_id").notNull(),
	branchCount: integer("branch_count").default(0),
}, (table) => [
	index("idx_message_branches_branch_count").using("btree", table.branchCount.asc().nullsLast().op("int4_ops")),
	index("idx_message_branches_conversation_id").using("btree", table.conversationId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [chatMessages.id],
			name: "message_branches_message_id_chat_messages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.branchId],
			foreignColumns: [chatBranches.id],
			name: "message_branches_branch_id_chat_branches_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "message_branches_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("message_branches_message_id_branch_id_unique").on(table.messageId, table.branchId),
]);

export const verificationToken = pgTable("verification_token", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_token_identifier_token_pk"}),
]);

export const account = pgTable("account", {
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_providerAccountId_pk"}),
]);

// RAG Schema Tables
export const documents = pgTable("documents", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text().notNull(),
	metadata: text(), // JSON string for document metadata
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "documents_user_id_user_id_fk"
	}).onDelete("cascade"),
	index("idx_documents_user_id").on(table.userId),
]);

export const chunks = pgTable("chunks", {
	id: text().primaryKey().notNull(),
	documentId: text("document_id").notNull(),
	text: text().notNull(),
	metadata: text(), // JSON string for chunk metadata
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.documentId],
		foreignColumns: [documents.id],
		name: "chunks_document_id_documents_id_fk"
	}).onDelete("cascade"),
	index("idx_chunks_document_id").on(table.documentId),
]);

export const embeddings = pgTable("embeddings", {
	id: text().primaryKey().notNull(),
	chunkId: text("chunk_id").notNull(),
	vector: sql`vector(1536)`, // OpenAI embeddings are 1536 dimensions
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.chunkId],
		foreignColumns: [chunks.id],
		name: "embeddings_chunk_id_chunks_id_fk"
	}).onDelete("cascade"),
	index("idx_embeddings_chunk_id").on(table.chunkId),
	// Vector similarity search index
	index("idx_embeddings_vector").on(sql`vector_cosine_similarity(${table.vector}, $1)`),
]);
