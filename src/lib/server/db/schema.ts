import { pgTable, text, timestamp, primaryKey, integer, boolean, jsonb, serial, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { vector } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: text('role').default('user'),
  isActive: boolean('isActive').default(true),
  hashedPassword: text('hashedPassword'),
  disabled: boolean('disabled').default(false)
});

export const account = pgTable('account', {
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').$type<'oauth' | 'oidc' | 'email'>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state')
}, (account) => ({
  compoundKey: primaryKey(account.provider, account.providerAccountId)
}));

export const session = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull()
});

export const verificationToken = pgTable('verification_token', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull()
}, (vt) => ({
  compoundKey: primaryKey(vt.identifier, vt.token)
}));

export const chat = pgTable('chat', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow()
});

// Updated message table for Git-like branching
export const message = pgTable('message', {
  id: text('id').primaryKey(),
  chatId: text('chatId').notNull().references(() => chat.id, { onDelete: 'cascade' }),
  parentId: text('parentId'), // Tree structure key - will be referenced in relations
  branchId: text('branchId'), // Branch reference for conversation branching
  role: text('role').$type<'user' | 'assistant' | 'system'>().notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'), // JSON string for additional data
  isEdited: boolean('isEdited').default(false),
  editHistory: jsonb('editHistory'), // JSON array of previous versions
  chunkCitations: jsonb('chunkCitations'), // Optional RAG citations
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow()
});

// Branch table for conversation branches (optional grouping)
export const branch = pgTable('branch', {
  id: text('id').primaryKey(),
  chatId: text('chatId').notNull().references(() => chat.id, { onDelete: 'cascade' }),
  name: text('name'), // Optional branch name
  parentBranchId: text('parentBranchId'), // Will reference branch.id for branch hierarchy - set after table creation
  isActive: boolean('isActive').default(false), // Only one branch can be active per chat
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow()
});

// Enhanced Conversation Branch Management Table
export const conversationBranch = pgTable('conversation_branch', {
  id: text('id').primaryKey(),
  chatId: text('chatId').notNull().references(() => chat.id, { onDelete: 'cascade' }),
  rootMessageId: text('rootMessageId').notNull().references(() => message.id, { onDelete: 'cascade' }),
  branchName: text('branchName'),
  description: text('description'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow()
});

// Message Tags for Organization
export const messageTag = pgTable('message_tag', {
  id: text('id').primaryKey(),
  messageId: text('messageId').notNull().references(() => message.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow()
});

// New tables for vector search functionality
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  uploadedBy: text('uploaded_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
});

export const chunks = pgTable('chunks', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  order: integer('order').notNull(), // Order of chunk in document
  metadata: jsonb('metadata')
});

export const embeddings = pgTable('embeddings', {
  id: serial('id').primaryKey(),
  chunkId: integer('chunk_id').notNull().references(() => chunks.id, { onDelete: 'cascade' }),
  embedding: vector('embedding', { dimensions: 768 }).notNull() // Use proper vector type
});

// New RAG persistence tables
export const conversationDocuments = pgTable('conversationDocuments', {
  id: text('id').primaryKey(),
  conversationId: text('conversationId').notNull().references(() => chat.id, { onDelete: 'cascade' }),
  documentId: integer('documentId').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  uploadedAt: timestamp('uploadedAt', { mode: 'date' }).notNull().defaultNow(),
  metadata: jsonb('metadata')
});

export const messageBranches = pgTable('messageBranches', {
  id: text('id').primaryKey(),
  messageId: text('messageId').notNull().references(() => message.id, { onDelete: 'cascade' }),
  branchCount: integer('branchCount').notNull().default(0),
  lastUpdated: timestamp('lastUpdated', { mode: 'date' }).notNull().defaultNow()
});

// Relations for easier querying
export const documentsRelations = relations(documents, ({ many, one }) => ({
  chunks: many(chunks),
  uploadedByUser: one(user, {
    fields: [documents.uploadedBy],
    references: [user.id]
  }),
  conversationDocuments: many(conversationDocuments)
}));

export const chunksRelations = relations(chunks, ({ many, one }) => ({
  embeddings: many(embeddings),
  document: one(documents, {
    fields: [chunks.documentId],
    references: [documents.id]
  })
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  chunk: one(chunks, {
    fields: [embeddings.chunkId],
    references: [chunks.id]
  })
}));

export const chatRelations = relations(chat, ({ many, one }) => ({
  branches: many(branch),
  conversationBranches: many(conversationBranch),
  messages: many(message),
  conversationDocuments: many(conversationDocuments),
  user: one(user, {
    fields: [chat.userId],
    references: [user.id]
  })
}));

export const branchRelations = relations(branch, ({ one }) => ({
  chat: one(chat, {
    fields: [branch.chatId],
    references: [chat.id]
  }),
  parentBranch: one(branch, {
    fields: [branch.parentBranchId],
    references: [branch.id]
  })
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id]
  }),
  parentMessage: one(message, {
    fields: [message.parentId],
    references: [message.id]
  }),
  children: many(message, { relationName: 'parentMessage' }),
  messageBranches: one(messageBranches, {
    fields: [message.id],
    references: [messageBranches.messageId]
  }),
  tags: many(messageTag)
}));

export const conversationDocumentsRelations = relations(conversationDocuments, ({ one }) => ({
  chat: one(chat, {
    fields: [conversationDocuments.conversationId],
    references: [chat.id]
  }),
  document: one(documents, {
    fields: [conversationDocuments.documentId],
    references: [documents.id]
  })
}));

export const messageBranchesRelations = relations(messageBranches, ({ one }) => ({
  message: one(message, {
    fields: [messageBranches.messageId],
    references: [message.id]
  })
}));

// Enhanced relations for new tables
export const conversationBranchRelations = relations(conversationBranch, ({ one }) => ({
  chat: one(chat, { fields: [conversationBranch.chatId], references: [chat.id] }),
  rootMessage: one(message, { fields: [conversationBranch.rootMessageId], references: [message.id] })
}));

export const messageTagRelations = relations(messageTag, ({ one }) => ({
  message: one(message, { fields: [messageTag.messageId], references: [message.id] })
}));

