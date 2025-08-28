import { pgTable, foreignKey, text, timestamp, boolean, unique, index, integer, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const user = pgTable("user", {
	id: text("id").primaryKey().notNull(),
	name: text("name"),
	email: text("email").notNull(),
	emailVerified: timestamp("emailVerified", { mode: 'string' }),
	image: text("image"),
	role: text("role").default('user'),
	isActive: boolean("isActive").default(true),
	hashedPassword: text("hashedPassword"),
	disabled: boolean("disabled").default(false),
}, (table) => ({
	emailUnique: unique("user_email_unique").on(table.email),
}));

export const chat = pgTable("chat", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text("title").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
	userIdFk: foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "chat_user_id_user_id_fk"
	}).onDelete("cascade"),
}));

export const chatMessages = pgTable("chat_messages", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	conversationId: text("conversation_id").notNull(),
	parentMessageId: text("parent_message_id"),
	originalMessageId: text("original_message_id"),
	role: text("role").notNull(),
	content: text("content").notNull(),
	chunkCitations: text("chunk_citations"),
	timestamp: timestamp("timestamp", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
	userIdFk: foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "chat_messages_user_id_user_id_fk"
	}).onDelete("cascade"),
}));

export const message = pgTable("message", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	conversationId: text("conversation_id").notNull(),
	role: text("role").notNull(),
	content: text("content").notNull(),
	timestamp: timestamp("timestamp", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
	userIdFk: foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "message_user_id_user_id_fk"
	}).onDelete("cascade"),
}));

export const session = pgTable("session", {
	sessionToken: text("sessionToken").primaryKey().notNull(),
	userId: text("userId").notNull(),
	expires: timestamp("expires", { mode: 'string' }).notNull(),
}, (table) => ({
	userIdFk: foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "session_userId_user_id_fk"
	}).onDelete("cascade"),
}));

export const chatBranches = pgTable("chat_branches", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	conversationId: text("conversation_id").notNull(),
	parentBranchId: text("parent_branch_id"),
	branchName: text("branch_name").default('Main').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => ({
	userIdFk: foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "chat_branches_user_id_user_id_fk"
	}).onDelete("cascade"),
}));

export const messageBranches = pgTable("message_branches", {
	id: text("id").primaryKey().notNull(),
	messageId: text("message_id").notNull(),
	branchId: text("branch_id").notNull(),
	userId: text("user_id").notNull(),
	conversationId: text("conversation_id").notNull(),
	branchCount: integer("branch_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
	branchCountIdx: index("idx_message_branches_branch_count").on(table.branchCount),
	conversationIdIdx: index("idx_message_branches_conversation_id").on(table.conversationId),
	messageIdFk: foreignKey({
		columns: [table.messageId],
		foreignColumns: [chatMessages.id],
		name: "message_branches_message_id_chat_messages_id_fk"
	}).onDelete("cascade"),
	branchIdFk: foreignKey({
		columns: [table.branchId],
		foreignColumns: [chatBranches.id],
		name: "message_branches_branch_id_chat_branches_id_fk"
	}).onDelete("cascade"),
	userIdFk: foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "message_branches_user_id_user_id_fk"
	}).onDelete("cascade"),
	messageBranchUnique: unique("message_branches_message_id_branch_id_unique").on(table.messageId, table.branchId),
}));

export const verificationToken = pgTable("verification_token", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires", { mode: 'string' }).notNull(),
}, (table) => ({
	identifierTokenPk: primaryKey({ columns: [table.identifier, table.token], name: "verification_token_identifier_token_pk"}),
}));

export const account = pgTable("account", {
	userId: text("userId").notNull(),
	type: text("type").notNull(),
	provider: text("provider").notNull(),
	providerAccountId: text("providerAccountId").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text("scope"),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => ({
	userIdFk: foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "account_userId_user_id_fk"
	}).onDelete("cascade"),
	providerAccountPk: primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_providerAccountId_pk"}),
}));

// RAG Schema Tables
export const documents = pgTable("documents", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	metadata: text("metadata"), // JSON string for document metadata
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
	userIdFk: foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "documents_user_id_user_id_fk"
	}).onDelete("cascade"),
	userIdIdx: index("idx_documents_user_id").on(table.userId),
}));

export const chunks = pgTable("chunks", {
	id: text("id").primaryKey().notNull(),
	documentId: text("document_id").notNull(),
	text: text("text").notNull(),
	metadata: text("metadata"), // JSON string for chunk metadata
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
	documentIdFk: foreignKey({
		columns: [table.documentId],
		foreignColumns: [documents.id],
		name: "chunks_document_id_documents_id_fk"
	}).onDelete("cascade"),
	documentIdIdx: index("idx_chunks_document_id").on(table.documentId),
}));

export const embeddings = pgTable("embeddings", {
	id: text("id").primaryKey().notNull(),
	chunkId: text("chunk_id").notNull(),
	vector: text("vector").notNull(), // Store as JSON string for now
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
	chunkIdFk: foreignKey({
		columns: [table.chunkId],
		foreignColumns: [chunks.id],
		name: "embeddings_chunk_id_chunks_id_fk"
	}).onDelete("cascade"),
	chunkIdIdx: index("idx_embeddings_chunk_id").on(table.chunkId),
}));
