import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { chat } from '$lib/server/db/schema';

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

    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, chatId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to access this chat' }, { status: 403 });
    }

    // Load all messages for this chat with proper parent-child relationships
    const messages = await db.select().from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(message.createdAt as any);
    
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

    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, chatId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to access this chat' }, { status: 403 });
    }

    const [newMessage] = await db.insert(message).values({
      id,
      chatId,
      parentId: parentId,
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

export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    console.log('🔧 PUT /api/chat/message - Starting message branch creation...');
    
    const session = await locals.auth();
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - No session or user ID');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', session.user.id);

    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { messageId, content } = body;
    
    if (!messageId || !content) {
      console.log('❌ Missing required fields:', { messageId, content });
      return json({ error: 'Message ID and content are required' }, { status: 400 });
    }

    console.log('🔍 Looking for original message:', messageId);

    // Get the original message to verify ownership and get context
    const existingMessage = await db.select().from(message).where(eq(message.id, messageId)).limit(1);
    
    if (existingMessage.length === 0) {
      console.log('❌ Message not found:', messageId);
      return json({ error: 'Message not found' }, { status: 404 });
    }

    const originalMsg = existingMessage[0];
    console.log('✅ Original message found:', { id: originalMsg.id, chatId: originalMsg.chatId, role: originalMsg.role });
    
    // Verify the message belongs to the current user
    if (originalMsg.chatId) {
      console.log('🔍 Verifying chat ownership for chat:', originalMsg.chatId);
      
      const chatResult = await db.select().from(chat).where(eq(chat.id, originalMsg.chatId)).limit(1);
      console.log('📋 Chat query result:', chatResult);
      
      if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
        console.log('❌ Unauthorized to edit message - Chat not found or wrong user');
        return json({ error: 'Unauthorized to edit this message' }, { status: 403 });
      }
      
      console.log('✅ Chat ownership verified');
    }

    // Only allow editing user messages
    if (originalMsg.role !== 'user') {
      console.log('❌ Cannot edit non-user messages');
      return json({ error: 'Only user messages can be edited' }, { status: 400 });
    }

    console.log('🔄 Creating new message branch...');

    // Create a new message as a branch from the original
    const newMessageId = randomUUID();
    const [newMessage] = await db.insert(message).values({
      id: newMessageId,
      chatId: originalMsg.chatId,
      parentId: originalMsg.parentId, // Link to the same parent as the original
      role: 'user',
      content: content,
      createdAt: new Date()
    }).returning();

    console.log('✅ New message branch created successfully:', newMessage);

    return json({
      success: true,
      message: newMessage,
      originalMessageId: originalMsg.id,
      isBranch: true
    });

  } catch (error: any) {
    console.error('❌ Error creating message branch:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    
    return json({ 
      error: 'Failed to create message branch',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
};


