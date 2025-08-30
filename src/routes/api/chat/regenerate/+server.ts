import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message, chat, branch } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { env } from '$env/dynamic/private';
import { generateText } from '$lib/ai';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    console.log('🔄 POST /api/chat/regenerate - Starting AI response regeneration...');
    
    const session = await locals.auth();
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - No session or user ID');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', session.user.id);

    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { messageId, conversationContext } = body;
    
    if (!messageId) {
      console.log('❌ Missing required fields:', { messageId });
      return json({ error: 'Message ID is required' }, { status: 400 });
    }

    console.log('🔍 Looking for message to regenerate from:', messageId);

    // Get the message to regenerate from
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
        console.log('❌ Unauthorized to regenerate from message - Chat not found or wrong user');
        return json({ error: 'Unauthorized to regenerate from this message' }, { status: 403 });
      }
      
      console.log('✅ Chat ownership verified');
    }

    // Only allow regenerating from user messages
    if (originalMsg.role !== 'user') {
      console.log('❌ Cannot regenerate from non-user messages');
      return json({ error: 'Only user messages can be used for regeneration' }, { status: 400 });
    }

    console.log('🔄 Creating new AI response branch...');

    // Check if branch table exists
    let hasBranchTable = false;
    let newBranchId = randomUUID();
    try {
      const branchTableExists = await db.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'branch'
        )
      `);
      hasBranchTable = (branchTableExists[0] as any)?.exists || false;
    } catch (error) {
      console.log('Could not check if branch table exists, assuming it does not');
      hasBranchTable = false;
    }

    let newBranch = null;
    if (hasBranchTable) {
      // Create a new branch for this regeneration
      [newBranch] = await db.insert(branch).values({
        id: newBranchId,
        chatId: originalMsg.chatId,
        name: `Regenerated response from "${originalMsg.content.substring(0, 30)}..."`,
        parentBranchId: originalMsg.branchId || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Deactivate the original branch if it has branchId
      if (originalMsg.branchId) {
        await db.update(branch).set({ isActive: false }).where(eq(branch.id, originalMsg.branchId));
      }
    }

    // Generate new AI response
    let aiResponse = '';
    try {
      if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== '') {
        console.log('🚀 Using OpenAI for regeneration');
        const result = await generateText({
          prompt: `User: ${originalMsg.content}\n\nPlease provide a new, different response to this message.`,
          model: 'gpt-3.5-turbo',
          maxTokens: 1000,
          temperature: 0.8
        });
        aiResponse = result.text;
      } else if (env.GOOGLE_GENERATIVE_AI_API_KEY && env.GOOGLE_GENERATIVE_AI_API_KEY.trim() !== '') {
        console.log('🔄 Using Google Generative AI for regeneration');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${env.GOOGLE_GENERATIVE_AI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `User: ${originalMsg.content}\n\nPlease provide a new, different response to this message.` }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 1000
            }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a new response.';
        } else {
          throw new Error(`Google API error: ${response.statusText}`);
        }
      } else {
        // Fallback response
        aiResponse = `Here's a different perspective on your message: "${originalMsg.content}"\n\nThis is a regenerated response that offers an alternative viewpoint or approach to your question.`;
      }
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      aiResponse = 'Sorry, I encountered an error while generating a new response. Please try again.';
    }

    // Create the new AI message
    const newMessageId = randomUUID();
    
    let messageValues: any = {
      id: newMessageId,
      chatId: originalMsg.chatId,
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date()
    };

    // Add new schema fields only if they exist
    if (hasBranchTable) {
      messageValues.branchId = newBranchId;
      messageValues.parentMessageId = originalMsg.id;
    }

    const [newMessage] = await db.insert(message).values(messageValues).returning();

    console.log('✅ New AI response branch created successfully:', { branch: newBranch, message: newMessage });

    return json({
      success: true,
      branch: newBranch,
      message: newMessage,
      originalMessageId: originalMsg.id,
      isRegeneration: true
    });

  } catch (error: any) {
    console.error('❌ Error regenerating AI response:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    
    return json({ 
      error: 'Failed to regenerate AI response',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
};
