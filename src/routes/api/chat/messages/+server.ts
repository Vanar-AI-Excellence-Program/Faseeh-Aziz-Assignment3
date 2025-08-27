import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chatMessages, chatBranches, messageBranches } from '$lib/server/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = url.searchParams.get('conversationId');
    const branchId = url.searchParams.get('branchId') || 'main';
    
    if (!conversationId) {
      return json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const userId = session.user.id;

    console.log('Loading messages for conversation:', conversationId, 'branch:', branchId);

    // Get all branches for this conversation
    const branches = await db.query.chatBranches.findMany({
      where: and(
        eq(chatBranches.conversationId, conversationId),
        eq(chatBranches.userId, userId),
        eq(chatBranches.isActive, true)
      ),
      orderBy: [asc(chatBranches.createdAt)]
    });

    console.log('Found', branches.length, 'branches for conversation:', conversationId);

    // Get all messages for this conversation
    const allMessages = await db
      .select()
      .from(chatMessages)
      .where(and(
        eq(chatMessages.conversationId, conversationId),
        eq(chatMessages.userId, userId)
      ))
      .orderBy(asc(chatMessages.createdAt));

    console.log('Found', allMessages.length, 'total messages for conversation:', conversationId);

    // Get all message-branch relationships for this conversation
    const messageBranchRelations = await db
      .select()
      .from(messageBranches)
      .where(and(
        eq(messageBranches.conversationId, conversationId),
        eq(messageBranches.userId, userId)
      ));

    console.log('Found', messageBranchRelations.length, 'message-branch relationships for conversation:', conversationId);

    // Create a map of message IDs to their branch assignments
    const messageToBranches = new Map<string, string[]>();
    messageBranchRelations.forEach(relation => {
      const existing = messageToBranches.get(relation.messageId) || [];
      existing.push(relation.branchId);
      messageToBranches.set(relation.messageId, existing);
    });

    // Group messages by branchId
    const groupedMessages: Record<string, any[]> = {};
    
    // Initialize with main branch
    groupedMessages['main'] = [];
    
    // Add all branches from database
    branches.forEach(branch => {
      groupedMessages[branch.id] = [];
    });

    // Assign messages to branches
    allMessages.forEach(message => {
      const messageBranches = messageToBranches.get(message.id) || [];
      
      // If message has explicit branch assignments, add to those branches
      if (messageBranches.length > 0) {
        messageBranches.forEach(branchId => {
          if (!groupedMessages[branchId]) {
            groupedMessages[branchId] = [];
          }
          groupedMessages[branchId].push({
            id: message.originalMessageId || message.id,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
            createdAt: message.createdAt,
            parentId: message.parentMessageId,
            originalMessageId: message.originalMessageId
          });
        });
      } else {
        // If no explicit branch assignment, add to main branch
        groupedMessages['main'].push({
          id: message.originalMessageId || message.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
          createdAt: message.createdAt,
          parentId: message.parentMessageId,
          originalMessageId: message.originalMessageId
        });
      }
    });

    // Sort messages within each branch by creation time
    Object.keys(groupedMessages).forEach(branchId => {
      groupedMessages[branchId].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    console.log('Grouped messages by branch:', Object.keys(groupedMessages).map(branchId => ({
      branchId,
      messageCount: groupedMessages[branchId].length
    })));

    // Map branch data to frontend format
    const mappedBranches = branches.map(branch => ({
      id: branch.id,
      name: branch.branchName,
      messageCount: groupedMessages[branch.id]?.length || 0,
      parentBranchId: branch.parentBranchId
    }));

    console.log('Mapped branches for frontend:', mappedBranches.map(b => ({ id: b.id, name: b.name })));

    return json({ 
      success: true, 
      messages: groupedMessages,
      branches: mappedBranches,
      currentBranchId: branchId
    });
  } catch (error) {
    console.error('Error fetching messages with branches:', error);
    return json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
};
