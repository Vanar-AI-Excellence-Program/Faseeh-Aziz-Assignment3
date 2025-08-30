import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, content } = await request.json();
    
    if (!messageId || !content) {
      return json({ error: 'Message ID and content are required' }, { status: 400 });
    }

    // Update the message in the database
    const [updatedMessage] = await db.update(message)
      .set({ 
        content: content,
        // You could add an updatedAt field here if you want to track edits
      })
      .where(eq(message.id, messageId))
      .returning();

    if (!updatedMessage) {
      return json({ error: 'Message not found' }, { status: 404 });
    }

    console.log('✅ Message updated:', messageId);

    return json({ 
      success: true, 
      message: updatedMessage 
    });

  } catch (error: any) {
    console.error('❌ Failed to update message:', error);
    return json({ 
      error: 'Failed to update message',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
};
