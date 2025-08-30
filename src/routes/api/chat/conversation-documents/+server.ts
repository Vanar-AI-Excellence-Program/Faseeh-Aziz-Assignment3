import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { conversationDocuments, documents, chat } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// Get all documents linked to a conversation
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = url.searchParams.get('conversationId');
    if (!conversationId) {
      return json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, conversationId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to access this conversation' }, { status: 403 });
    }

    // Get all documents linked to this conversation
    const linkedDocuments = await db.select({
      id: conversationDocuments.id,
      documentId: conversationDocuments.documentId,
      uploadedAt: conversationDocuments.uploadedAt,
      metadata: conversationDocuments.metadata,
      document: {
        id: documents.id,
        name: documents.name,
        metadata: documents.metadata,
        createdAt: documents.createdAt
      }
    })
    .from(conversationDocuments)
    .innerJoin(documents, eq(conversationDocuments.documentId, documents.id))
    .where(eq(conversationDocuments.conversationId, conversationId));

    return json({ 
      success: true, 
      documents: linkedDocuments
    });
  } catch (error) {
    console.error('Error fetching conversation documents:', error);
    return json({ error: 'Failed to fetch conversation documents' }, { status: 500 });
  }
};

// Link a document to a conversation
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, documentId, metadata } = await request.json();
    
    if (!conversationId || !documentId) {
      return json({ error: 'Conversation ID and Document ID are required' }, { status: 400 });
    }

    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, conversationId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to access this conversation' }, { status: 403 });
    }

    // Verify document exists and belongs to user
    const documentResult = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
    if (documentResult.length === 0 || documentResult[0].uploadedBy !== session.user.id) {
      return json({ error: 'Document not found or unauthorized' }, { status: 404 });
    }

    // Check if link already exists
    const existingLink = await db.select().from(conversationDocuments)
      .where(and(eq(conversationDocuments.conversationId, conversationId), eq(conversationDocuments.documentId, documentId)))
      .limit(1);

    if (existingLink.length > 0) {
      return json({ error: 'Document already linked to this conversation' }, { status: 400 });
    }

    // Create the link
    const [newLink] = await db.insert(conversationDocuments).values({
      id: crypto.randomUUID(),
      conversationId,
      documentId,
      uploadedAt: new Date(),
      metadata: metadata || {}
    }).returning();

    return json({ 
      success: true, 
      link: newLink
    });
  } catch (error) {
    console.error('Error linking document to conversation:', error);
    return json({ error: 'Failed to link document to conversation' }, { status: 500 });
  }
};

// Remove a document link from a conversation
export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, documentId } = await request.json();
    
    if (!conversationId || !documentId) {
      return json({ error: 'Conversation ID and Document ID are required' }, { status: 400 });
    }

    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, conversationId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to access this conversation' }, { status: 403 });
    }

    // Remove the link
    await db.delete(conversationDocuments)
      .where(and(eq(conversationDocuments.conversationId, conversationId), eq(conversationDocuments.documentId, documentId)));

    return json({ 
      success: true, 
      message: 'Document link removed from conversation'
    });
  } catch (error) {
    console.error('Error removing document link from conversation:', error);
    return json({ error: 'Failed to remove document link from conversation' }, { status: 500 });
  }
};
