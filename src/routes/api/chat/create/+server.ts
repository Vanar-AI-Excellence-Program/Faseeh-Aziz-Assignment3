import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chat } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title } = await request.json();
    
    if (!id || !title) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newChat] = await db.insert(chat).values({
      id,
      title,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return json({ success: true, chat: newChat });
  } catch (error) {
    console.error('Error creating chat:', error);
    return json({ error: 'Failed to create chat' }, { status: 500 });
  }
};


