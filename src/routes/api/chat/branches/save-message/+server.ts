import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chatMessages, messageBranches } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const session = await locals.auth();
        if (!session?.user?.id) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { branchId, conversationId, message, parentMessageId } = await request.json();
        
        if (!branchId || !conversationId || !message) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate message object has required fields
        if (!message.role || !message.content) {
            return json({ error: 'Message must have role and content' }, { status: 400 });
        }

        const userId = session.user.id;

        // Insert the message
        const messageId = generateId();
        const originalMessageId = message.id || generateId(); // Use frontend ID if available
        await db.insert(chatMessages).values({
            id: messageId,
            userId,
            conversationId,
            parentMessageId: parentMessageId || null,
            originalMessageId: originalMessageId,
            role: message.role,
            content: message.content,
            timestamp: new Date(),
            createdAt: new Date()
        });

        // Assign message to the branch
        await db.insert(messageBranches).values({
            id: generateId(),
            messageId,
            branchId,
            conversationId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return json({ 
            success: true, 
            messageId: messageId 
        });

    } catch (error) {
        console.error('Error saving message to branch:', error);
        return json({ error: 'Failed to save message' }, { status: 500 });
    }
};
