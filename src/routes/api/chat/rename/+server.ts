import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chat } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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

    await db.update(chat).set({ 
      title,
      updatedAt: new Date()
    }).where(eq(chat.id, id));

    return json({ success: true });
  } catch (error) {
    console.error('Error renaming chat:', error);
    return json({ error: 'Failed to rename chat' }, { status: 500 });
  }
};


