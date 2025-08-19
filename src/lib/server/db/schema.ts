import { pgTable, text, timestamp, primaryKey, integer, boolean } from 'drizzle-orm/pg-core';

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

export const message = pgTable('message', {
  id: text('id').primaryKey(),
  chatId: text('chatId').notNull().references(() => chat.id, { onDelete: 'cascade' }),
  parentId: text('parentId'), // For tree structure - will reference message.id
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow()
});
