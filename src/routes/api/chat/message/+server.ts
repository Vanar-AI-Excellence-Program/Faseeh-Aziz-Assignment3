import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = url.searchParams.get('chatId');
    if (!chatId) {
      return json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const messages = await db.select().from(message).where(eq(message.chatId, chatId)).orderBy(message.createdAt as any);
    
    return json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, chatId, parentId, role, content } = await request.json();
    
    if (!id || !chatId || !role || !content) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newMessage] = await db.insert(message).values({
      id,
      chatId,
      parentId,
      role,
      content,
      createdAt: new Date()
    }).returning();

    return json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error saving message:', error);
    return json({ error: 'Failed to save message' }, { status: 500 });
  }
};


