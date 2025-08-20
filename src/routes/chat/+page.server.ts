import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chat, message, user } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw redirect(303, '/login');

  // Always fetch fresh user data from database to get latest role
  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id));
  if (!userData) throw redirect(303, '/login');
  if (userData.disabled) throw redirect(303, `/login?error=disabled&message=${encodeURIComponent('Account is disabled. Please contact an administrator.')}`);

  const userId = userData.id;
  const chatsData = await db.select().from(chat).where(eq(chat.userId, userId)).orderBy(chat.updatedAt as any);
  const firstChatId = chatsData[0]?.id ?? null;
  const messagesData = firstChatId
    ? await db.select().from(message).where(and(eq(message.chatId, firstChatId)) as any)
    : [];

  return { 
    user: { 
      id: userData.id, 
      name: userData.name, 
      email: userData.email, 
      role: userData.role 
    },
    chats: chatsData,
    messages: messagesData
  } as any;
};

export const actions: Actions = {
  createChat: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user?.id) throw redirect(303, '/login');

    const formData = await request.formData();
    const title = String(formData.get('title') ?? '').trim();
    
    if (!title) {
      return fail(400, { error: 'Chat title is required' });
    }

    try {
      const [newChat] = await db.insert(chat).values({
        id: randomUUID(),
        title,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return { success: true, chat: newChat };
    } catch (error) {
      console.error('Error creating chat:', error);
      return fail(500, { error: 'Failed to create chat' });
    }
  },

  sendMessage: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user?.id) throw redirect(303, '/login');

    const formData = await request.formData();
    const content = String(formData.get('content') ?? '').trim();
    const chatId = String(formData.get('chatId') ?? '');
    
    if (!content || !chatId) {
      return fail(400, { error: 'Message content and chat ID are required' });
    }

    try {
      // Insert user message
      const [userMessage] = await db.insert(message).values({
        id: randomUUID(),
        content,
        role: 'user',
        chatId,
        createdAt: new Date()
      }).returning();

      // Update chat's updatedAt
      await db.update(chat).set({ updatedAt: new Date() }).where(eq(chat.id, chatId));

      // Simulate AI response (replace with actual AI API call)
      const aiResponse = `I received your message: "${content}". This is a simulated response. In a real implementation, this would connect to an AI service.`;
      
      const [aiMessage] = await db.insert(message).values({
        id: randomUUID(),
        content: aiResponse,
        role: 'assistant',
        chatId,
        createdAt: new Date()
      }).returning();

      return { 
        success: true, 
        userMessage, 
        aiMessage 
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return fail(500, { error: 'Failed to send message' });
    }
  },

  deleteChat: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user?.id) throw redirect(303, '/login');

    const formData = await request.formData();
    const chatId = String(formData.get('chatId') ?? '');
    
    if (!chatId) {
      return fail(400, { error: 'Chat ID is required' });
    }

    try {
      // Delete all messages in the chat first
      await db.delete(message).where(eq(message.chatId, chatId));
      
      // Delete the chat
      await db.delete(chat).where(eq(chat.id, chatId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting chat:', error);
      return fail(500, { error: 'Failed to delete chat' });
    }
  },

  renameChat: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user?.id) throw redirect(303, '/login');

    const formData = await request.formData();
    const chatId = String(formData.get('chatId') ?? '');
    const title = String(formData.get('title') ?? '').trim();
    
    if (!chatId || !title) {
      return fail(400, { error: 'Chat ID and title are required' });
    }

    try {
      await db.update(chat).set({ 
        title,
        updatedAt: new Date()
      }).where(eq(chat.id, chatId));

      return { success: true };
    } catch (error) {
      console.error('Error renaming chat:', error);
      return fail(500, { error: 'Failed to rename chat' });
    }
  }
};
