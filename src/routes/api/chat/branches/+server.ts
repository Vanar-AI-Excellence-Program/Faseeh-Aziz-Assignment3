import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message, chat, branch } from '$lib/server/db/schema';
import { eq, and, isNull, desc, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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

    // Fetch all branches for this chat
    const branches = await db.select().from(branch).where(eq(branch.chatId, chatId)).orderBy(asc(branch.createdAt));
    
    // Get the active branch
    const activeBranch = branches.find(b => b.isActive) || branches[0];
    
    // Get messages for the active branch
    let activeBranchMessages: any[] = [];
    if (activeBranch) {
      activeBranchMessages = await db.select().from(message).where(eq(message.branchId, activeBranch.id)).orderBy(asc(message.createdAt));
    }
    
    return json({ 
      success: true, 
      branches,
      activeBranch,
      messages: activeBranchMessages,
      totalBranches: branches.length
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
};

// Create a new branch
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, parentBranchId, name } = await request.json();
    if (!chatId) {
      return json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, chatId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to access this chat' }, { status: 403 });
    }

    // Deactivate all existing branches for this chat
    await db.update(branch).set({ isActive: false }).where(eq(branch.chatId, chatId));

    // Create new branch
    const newBranchId = randomUUID();
    const [newBranch] = await db.insert(branch).values({
      id: newBranchId,
      chatId,
      name: name || `Branch ${Date.now()}`,
      parentBranchId: parentBranchId || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return json({ 
      success: true, 
      branch: newBranch
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    return json({ error: 'Failed to create branch' }, { status: 500 });
  }
};

// Switch to a specific branch
export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, branchId } = await request.json();
    if (!chatId || !branchId) {
      return json({ error: 'Chat ID and Branch ID are required' }, { status: 400 });
    }

    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, chatId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to access this chat' }, { status: 403 });
    }

    // Verify branch exists and belongs to this chat
    const branchResult = await db.select().from(branch).where(and(eq(branch.id, branchId), eq(branch.chatId, chatId))).limit(1);
    if (branchResult.length === 0) {
      return json({ error: 'Branch not found' }, { status: 404 });
    }

    // Deactivate all branches for this chat
    await db.update(branch).set({ isActive: false }).where(eq(branch.chatId, chatId));

    // Activate the selected branch
    const [updatedBranch] = await db.update(branch).set({ 
      isActive: true, 
      updatedAt: new Date() 
    }).where(eq(branch.id, branchId)).returning();

    // Get messages for this branch
    const branchMessages = await db.select().from(message).where(eq(message.branchId, branchId)).orderBy(asc(message.createdAt));

    return json({ 
      success: true, 
      branch: updatedBranch,
      messages: branchMessages
    });
  } catch (error) {
    console.error('Error switching branch:', error);
    return json({ error: 'Failed to switch branch' }, { status: 500 });
  }
};

// Delete a branch (and all its messages)
export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, branchId } = await request.json();
    if (!chatId || !branchId) {
      return json({ error: 'Chat ID and Branch ID are required' }, { status: 400 });
    }

    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, chatId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to access this chat' }, { status: 403 });
    }

    // Verify branch exists and belongs to this chat
    const branchResult = await db.select().from(branch).where(and(eq(branch.id, branchId), eq(branch.chatId, chatId))).limit(1);
    if (branchResult.length === 0) {
      return json({ error: 'Branch not found' }, { status: 404 });
    }

    // Don't allow deleting the last branch
    const totalBranches = await db.select().from(branch).where(eq(branch.chatId, chatId));
    if (totalBranches.length <= 1) {
      return json({ error: 'Cannot delete the last branch' }, { status: 400 });
    }

    // Delete all messages in this branch
    await db.delete(message).where(eq(message.branchId, branchId));

    // Delete the branch
    await db.delete(branch).where(eq(branch.id, branchId));

    // If this was the active branch, activate another branch
    if (branchResult[0].isActive) {
      const remainingBranches = await db.select().from(branch).where(eq(branch.chatId, chatId)).limit(1);
      if (remainingBranches.length > 0) {
        await db.update(branch).set({ isActive: true }).where(eq(branch.id, remainingBranches[0].id));
      }
    }

    return json({ 
      success: true, 
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return json({ error: 'Failed to delete branch' }, { status: 500 });
  }
};
