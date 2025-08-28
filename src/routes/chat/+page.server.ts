import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chat, chatMessages } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ locals, parent }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return {
        user: null,
        chats: [],
        messages: []
      };
    }

    // Get user data from parent layout
    const parentData = await parent();
    const user = parentData.user || parentData.viewer;
    
    if (!user?.id) {
      return {
        user: null,
        chats: [],
        messages: []
      };
    }
    
    const userId = user.id;
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 5000);
    });
    
    const chatsDataPromise = db.select().from(chat).where(eq(chat.userId, userId)).orderBy(chat.updatedAt as any);
    const chatsData = await Promise.race([chatsDataPromise, timeoutPromise]) as any[];
    
    // Fetch messages for all chats
    const chatsWithMessages = await Promise.all(
      chatsData.map(async (chatData) => {
        try {
          const messagesData = await db.select().from(chatMessages).where(eq(chatMessages.conversationId, chatData.id));
          return {
            ...chatData,
            messages: messagesData
          };
        } catch (error) {
          console.error('Error fetching messages for chat:', chatData.id, error);
          return {
            ...chatData,
            messages: []
          };
        }
      })
    );

    return { 
      user,
      chats: chatsWithMessages,
      messages: [] // We don't need this anymore since messages are included with chats
    };
  } catch (error) {
    console.error('Error in chat page load:', error);
    return {
      user: null,
      chats: [],
      messages: []
    };
  }
};

export const actions: Actions = {
  createChat: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user?.id) throw new Error('No session');

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
    if (!session?.user?.id) throw new Error('No session');

    const formData = await request.formData();
    const content = String(formData.get('content') ?? '').trim();
    const chatId = String(formData.get('chatId') ?? '');
    
    if (!content || !chatId) {
      return fail(400, { error: 'Message content and chat ID are required' });
    }

    try {
      // Insert user message
      const [userMessage] = await db.insert(chatMessages).values({
        id: randomUUID(),
        content,
        role: 'user',
        userId: session.user.id,
        conversationId: chatId,
        timestamp: new Date(),
        createdAt: new Date()
      }).returning();

      // Update chat's updatedAt
      await db.update(chat).set({ updatedAt: new Date() }).where(eq(chat.id, chatId));

      // Simulate AI response (replace with actual AI API call)
      const aiResponse = `I received your message: "${content}". This is a simulated response. In a real implementation, this would connect to an AI service.`;
      
      const [aiMessage] = await db.insert(chatMessages).values({
        id: randomUUID(),
        content: aiResponse,
        role: 'assistant',
        userId: session.user.id,
        conversationId: chatId,
        timestamp: new Date(),
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
    if (!session?.user?.id) throw new Error('No session');

    const formData = await request.formData();
    const chatId = String(formData.get('chatId') ?? '');
    
    if (!chatId) {
      return fail(400, { error: 'Chat ID is required' });
    }

    try {
      // Delete all messages in the chat first
      await db.delete(chatMessages).where(eq(chatMessages.conversationId, chatId));
      
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
    if (!session?.user?.id) throw new Error('No session');

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
