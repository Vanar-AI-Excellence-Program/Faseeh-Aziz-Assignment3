import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message, chat } from '$lib/server/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';

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

    // Load all messages for this chat
    const allMessages = await db.select().from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(asc(message.createdAt as any));

    // Build conversation tree structure
    const conversationTree = buildConversationTree(allMessages);
    
    return json({ 
      success: true, 
      conversationTree,
      messages: allMessages,
      totalMessages: allMessages.length
    });
  } catch (error) {
    console.error('Error fetching conversation tree:', error);
    return json({ error: 'Failed to fetch conversation tree' }, { status: 500 });
  }
};

// Helper function to build conversation tree from flat message list
function buildConversationTree(messages: any[]) {
  const messageMap = new Map();
  const rootMessages: any[] = [];
  
  // First pass: create message map and identify root messages
  messages.forEach(msg => {
    messageMap.set(msg.id, {
      ...msg,
      children: [],
      branches: []
    });
    
    if (!msg.parentId) {
      rootMessages.push(msg);
    }
  });
  
  // Second pass: build parent-child relationships
  messages.forEach(msg => {
    if (msg.parentId) {
      const parent = messageMap.get(msg.parentId);
      if (parent) {
        parent.children.push(msg);
        
        // Check if this creates a branch (multiple children from same parent)
        if (parent.children.length > 1) {
          parent.branches = parent.children;
        }
      }
    }
  });
  
  // Third pass: identify branching points
  const branchingPoints = new Set();
  messages.forEach(msg => {
    if (msg.parentId) {
      const parent = messageMap.get(msg.parentId);
      if (parent && parent.children.length > 1) {
        branchingPoints.add(msg.parentId);
      }
    }
  });
  
  return {
    rootMessages: rootMessages.map(msg => messageMap.get(msg.id)),
    branchingPoints: Array.from(branchingPoints),
    messageMap: Object.fromEntries(messageMap),
    totalBranches: Array.from(branchingPoints).length
  };
}
