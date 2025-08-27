import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chatMessages, messageBranches } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        console.log('Get branch messages API called');
        
        const session = await locals.auth();
        if (!session?.user?.id) {
            console.log('User not authenticated');
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        const branchId = url.searchParams.get('branchId');
        const conversationId = url.searchParams.get('conversationId');
        
        if (!branchId || !conversationId) {
            return json({ error: 'Branch ID and Conversation ID required' }, { status: 400 });
        }

        console.log('Getting messages for branch:', branchId, 'conversation:', conversationId);

        // Get all messages for this branch using the join table
        const messagesWithBranches = await db
            .select({
                message: chatMessages,
                branchId: messageBranches.branchId
            })
            .from(chatMessages)
            .innerJoin(messageBranches, eq(chatMessages.id, messageBranches.messageId))
            .where(and(
                eq(messageBranches.branchId, branchId),
                eq(chatMessages.conversationId, conversationId),
                eq(chatMessages.userId, userId),
                eq(messageBranches.conversationId, conversationId),
                eq(messageBranches.userId, userId)
            ))
            .orderBy(asc(chatMessages.createdAt));

        console.log('Found', messagesWithBranches.length, 'messages for branch:', branchId);

        return json({ 
            messages: messagesWithBranches.map(({ message }) => ({
                id: message.id.toString(),
                originalMessageId: message.originalMessageId,
                role: message.role,
                content: message.content,
                timestamp: message.timestamp,
                createdAt: message.createdAt,
                parentMessageId: message.parentMessageId
            }))
        });

    } catch (error) {
        console.error('Error getting branch messages:', error);
        return json({ error: 'Failed to get branch messages' }, { status: 500 });
    }
};
