import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chat, message, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) throw redirect(303, '/login');

    // Always fetch fresh user data from database to get latest role
    const [userData] = await db.select().from(user).where(eq(user.id, session.user.id));
    if (!userData) throw redirect(303, '/login');
    if (userData.disabled) throw redirect(303, `/login?error=disabled&message=${encodeURIComponent('Account is disabled. Please contact an administrator.')}`);

    const userId = userData.id;
    const chatsData = await db.select().from(chat).where(eq(chat.userId, userId)).orderBy(chat.updatedAt as any);
    
    // Fetch messages for all chats
    const chatsWithMessages = await Promise.all(
      chatsData.map(async (chatData) => {
        try {
          // Fetch messages directly by chatId
          const messagesData = await db.select({
            id: message.id,
            role: message.role,
            content: message.content,
            chatId: message.chatId,
            parentId: message.parentId,
            chunkCitations: message.chunkCitations,
            createdAt: message.createdAt
          }).from(message).where(eq(message.chatId, chatData.id)).orderBy(message.createdAt as any);
          
          return {
            ...chatData,
            messages: messagesData
          };
        } catch (error) {
          console.error(`Error processing chat ${chatData.id}:`, error);
          // Return chat without messages if there's an error
          return {
            ...chatData,
            messages: []
          };
        }
      })
    );

    return { 
      user: { 
        id: userData.id, 
        name: userData.name, 
        email: userData.email, 
        role: userData.role 
      },
      chats: chatsWithMessages,
      messages: [] // We don't need this anymore since messages are included with chats
    } as any;
  } catch (error) {
    console.error('Error in chat page load:', error);
    // Return minimal data to prevent complete failure
    return {
      user: { id: '', name: '', email: '', role: '' },
      chats: [],
      messages: [],
      error: 'Failed to load chat data'
    };
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user?.id) throw redirect(303, '/login');

    const formData = await request.formData();
    const id = String(formData.get('id') ?? '');
    const title = String(formData.get('title') ?? 'New Chat');
    
    if (!id) {
      return fail(400, { error: 'Chat ID is required' });
    }

    try {
      const [newChat] = await db.insert(chat).values({
        id,
        userId: session.user.id,
        title,
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
        parentId: null,
        chunkCitations: null,
        createdAt: new Date()
      }).returning();

      // Update chat's updatedAt
      await db.update(chat).set({ updatedAt: new Date() }).where(eq(chat.id, chatId));

      // Simulate AI response (replace with actual AI API call)
      const aiResponse = `I received your message: "${content}". This is a simulated response. In a real implementation, this would connect to an AI service.`;
      
      // Insert AI message
      const [aiMessage] = await db.insert(message).values({
        id: randomUUID(),
        content: aiResponse,
        role: 'assistant',
        chatId,
        parentId: userMessage.id,
        chunkCitations: null,
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
    const id = String(formData.get('id') ?? '');
    
    if (!id) {
      return fail(400, { error: 'Chat ID is required' });
    }

    try {
      // Delete all messages first (due to foreign key constraints)
      await db.delete(message).where(eq(message.chatId, id));
      
      // Then delete the chat
      await db.delete(chat).where(eq(chat.id, id));

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
    const id = String(formData.get('id') ?? '');
    const title = String(formData.get('title') ?? '').trim();
    
    if (!id || !title) {
      return fail(400, { error: 'Chat ID and title are required' });
    }

    try {
      const [updatedChat] = await db.update(chat)
        .set({ 
          title, 
          updatedAt: new Date() 
        })
        .where(eq(chat.id, id))
        .returning();

      return { success: true, chat: updatedChat };
    } catch (error) {
      console.error('Error renaming chat:', error);
      return fail(500, { error: 'Failed to rename chat' });
    }
  }
};
