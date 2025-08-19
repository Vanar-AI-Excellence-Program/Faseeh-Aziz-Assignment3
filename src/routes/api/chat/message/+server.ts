import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';

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


