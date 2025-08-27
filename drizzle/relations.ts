import { relations } from "drizzle-orm/relations";
import { user, chat, chatMessages, message, session, chatBranches, messageBranches, account } from "./schema";

export const chatRelations = relations(chat, ({one}) => ({
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	chats: many(chat),
	chatMessages: many(chatMessages),
	messages: many(message),
	sessions: many(session),
	chatBranches: many(chatBranches),
	messageBranches: many(messageBranches),
	accounts: many(account),
}));

export const chatMessagesRelations = relations(chatMessages, ({one, many}) => ({
	user: one(user, {
		fields: [chatMessages.userId],
		references: [user.id]
	}),
	messageBranches: many(messageBranches),
}));

export const messageRelations = relations(message, ({one}) => ({
	user: one(user, {
		fields: [message.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const chatBranchesRelations = relations(chatBranches, ({one, many}) => ({
	user: one(user, {
		fields: [chatBranches.userId],
		references: [user.id]
	}),
	messageBranches: many(messageBranches),
}));

export const messageBranchesRelations = relations(messageBranches, ({one}) => ({
	chatMessage: one(chatMessages, {
		fields: [messageBranches.messageId],
		references: [chatMessages.id]
	}),
	chatBranch: one(chatBranches, {
		fields: [messageBranches.branchId],
		references: [chatBranches.id]
	}),
	user: one(user, {
		fields: [messageBranches.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));