import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chat, message } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    
    if (!id) {
      return json({ error: 'Missing chat ID' }, { status: 400 });
    }

    // Delete all messages in the chat first
    await db.delete(message).where(eq(message.chatId, id));
    
    // Delete the chat
    await db.delete(chat).where(eq(chat.id, id));

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return json({ error: 'Failed to delete chat' }, { status: 500 });
  }
};


