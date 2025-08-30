import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message, chat } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Helper function to check if a column exists
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ${tableName} 
      AND column_name = ${columnName}
    `);
    return (result as any[]).length > 0;
  } catch (error) {
    console.error('Error checking column existence:', error);
    return false;
  }
}

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = url.searchParams.get('chatId');
    const leafId = url.searchParams.get('leafId');
    
    if (!chatId) {
      return json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, chatId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to access this chat' }, { status: 403 });
    }

    let messages: any[] = [];
    
    if (leafId) {
      // Get linear branch: walk from root to specific leaf
      console.log('🌿 Getting linear branch from root to leaf:', leafId);
      
      try {
        // Check if parentId column exists first
        const hasParentId = await checkColumnExists('message', 'parentId');
        
        if (hasParentId) {
          // Use recursive CTE to walk the tree from root to leaf
          const result = await db.execute(sql`
            WITH RECURSIVE message_path AS (
              -- Start from the leaf message
              SELECT id, chatId, "parentId", role, content, "chunkCitations", "createdAt", 0 as depth
              FROM message 
              WHERE id = ${leafId} AND chatId = ${chatId}
              
              UNION ALL
              
              -- Walk up to parent messages
              SELECT m.id, m.chatId, m."parentId", m.role, m.content, m."chunkCitations", m."createdAt", mp.depth + 1
              FROM message m
              INNER JOIN message_path mp ON m.id = mp."parentId"
              WHERE m.chatId = ${chatId}
            )
            SELECT * FROM message_path 
            ORDER BY depth DESC
          `);
          
          messages = result as any[];
          console.log('✅ Linear branch retrieved:', messages.length, 'messages');
        } else {
          // Fallback: get all messages for the chat (linear mode)
          console.log('⚠️ parentId column not found, using linear fallback');
          messages = await db.select().from(message)
            .where(eq(message.chatId, chatId))
            .orderBy(message.createdAt as any);
        }
      } catch (error) {
        console.error('❌ Error getting linear branch:', error);
        // Fallback: get all messages for the chat
        messages = await db.select().from(message)
          .where(eq(message.chatId, chatId))
          .orderBy(message.createdAt as any);
      }
    } else {
      // Get all messages for tree view
      console.log('🌳 Getting all messages for tree view');
      messages = await db.select().from(message)
        .where(eq(message.chatId, chatId))
        .orderBy(message.createdAt as any);
    }
    
    return json({ 
      success: true, 
      messages,
      totalMessages: messages.length,
      isLinearBranch: !!leafId
    });
  } catch (error) {
    console.error('Error fetching linear branch:', error);
    return json({ error: 'Failed to fetch linear branch' }, { status: 500 });
  }
};
