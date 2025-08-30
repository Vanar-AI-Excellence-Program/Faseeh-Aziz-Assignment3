import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, documents, chunks, embeddings, chat, message } from '$lib/server/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  
  if (!session?.user?.id) {
    throw redirect(302, '/login');
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    throw redirect(302, '/dashboard');
  }

  try {
    // Get user statistics
    const userCount = await db.select({ count: count() }).from(user);
    
    // Get document statistics
    const documentCount = await db.select({ count: count() }).from(documents);
    const chunkCount = await db.select({ count: count() }).from(chunks);
    const embeddingCount = await db.select({ count: count() }).from(embeddings);
    
    // Get chat statistics
    const chatCount = await db.select({ count: count() }).from(chat);
    const messageCount = await db.select({ count: count() }).from(message);
    
    // Get recent users
    const recentUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(10);
    
    // Get recent documents
    const recentDocuments = await db
      .select({
        id: documents.id,
        name: documents.name,
        uploadedBy: documents.uploadedBy,
        createdAt: documents.createdAt,
        metadata: documents.metadata
      })
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(10);
    
    // Get recent chats
    const recentChats = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        userId: chat.userId
      })
      .from(chat)
      .orderBy(desc(chat.createdAt))
      .limit(10);

    return {
      user: session.user,
      stats: {
        users: userCount[0].count,
        documents: documentCount[0].count,
        chunks: chunkCount[0].count,
        embeddings: embeddingCount[0].count,
        chats: chatCount[0].count,
        messages: messageCount[0].count
      },
      recentUsers,
      recentDocuments,
      recentChats
    };
  } catch (error) {
    console.error('❌ Error loading admin data:', error);
    throw redirect(302, '/dashboard');
  }
};
