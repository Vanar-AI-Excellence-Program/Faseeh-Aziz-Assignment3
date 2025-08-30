import { sql } from 'drizzle-orm';
import { db } from './index';

/**
 * Insert an embedding as a vector into the database
 */
export async function insertEmbedding(chunkId: number, embedding: number[]): Promise<any> {
  try {
    // Convert the embedding array to a PostgreSQL array string and cast to vector
    const embeddingArray = `[${embedding.join(',')}]`;
    
    const result = await db.execute(sql`
      INSERT INTO embeddings (chunk_id, embedding) 
      VALUES (${chunkId}, ${embeddingArray}::vector)
      RETURNING *
    `);
    
    return result[0];
  } catch (error) {
    console.error('Error inserting embedding:', error);
    throw error;
  }
}

/**
 * Find similar chunks using vector similarity search
 */
export async function findSimilarChunks(queryEmbedding: number[], limit: number = 5) {
  try {
    // Convert the embedding array to a PostgreSQL array string
    const embeddingArray = `[${queryEmbedding.join(',')}]`;
    
    // Use raw SQL for vector similarity search with proper vector type
    const results = await db.execute(sql`
      SELECT 
        c.id as chunk_id,
        c.content as chunk_content,
        c.order as chunk_order,
        c.metadata as chunk_metadata,
        d.id as document_id,
        d.name as document_name,
        d.metadata as document_metadata,
        e.embedding <-> ${embeddingArray}::vector as distance
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN embeddings e ON c.id = e.chunk_id
      WHERE e.embedding IS NOT NULL
      ORDER BY e.embedding <-> ${embeddingArray}::vector
      LIMIT ${limit}
    `);

    return results.map((row: any) => ({
      chunkId: row.chunk_id as number,
      content: row.chunk_content as string,
      order: row.chunk_order as number,
      chunkMetadata: row.chunk_metadata,
      documentId: row.document_id as number,
      documentName: row.document_name as string,
      documentMetadata: row.document_metadata,
      distance: row.distance as number
    }));
  } catch (error) {
    console.error('Vector search error:', error);
    return [];
  }
}

/**
 * Check if vector extension is available
 */
export async function checkVectorExtension(): Promise<boolean> {
  try {
    const result = await db.execute(sql`SELECT 1 FROM pg_extension WHERE extname = 'vector'`);
    return result.length > 0;
  } catch (error) {
    console.error('Error checking vector extension:', error);
    return false;
  }
}

/**
 * Get database statistics for debugging
 */
export async function getDatabaseStats() {
  try {
    const docCount = await db.execute(sql`SELECT COUNT(*) as count FROM documents`);
    const chunkCount = await db.execute(sql`SELECT COUNT(*) as count FROM chunks`);
    const embeddingCount = await db.execute(sql`SELECT COUNT(*) as count FROM embeddings`);
    const chatCount = await db.execute(sql`SELECT COUNT(*) as count FROM chat`);
    const messageCount = await db.execute(sql`SELECT COUNT(*) as count FROM message`);
    const branchCount = await db.execute(sql`SELECT COUNT(*) as count FROM conversation_branch`);

    return {
      documents: docCount[0]?.count || 0,
      chunks: chunkCount[0]?.count || 0,
      embeddings: embeddingCount[0]?.count || 0,
      chats: chatCount[0]?.count || 0,
      messages: messageCount[0]?.count || 0,
      branches: branchCount[0]?.count || 0
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { documents: 0, chunks: 0, embeddings: 0, chats: 0, messages: 0, branches: 0 };
  }
}

/**
 * Enhanced vector search with conversation context
 */
export async function findSimilarChunksWithContext(
  queryEmbedding: number[],
  chatId?: string,
  limit: number = 5,
  contextDepth: number = 2
) {
  try {
    const embeddingArray = `[${queryEmbedding.join(',')}]`;

    // First, get general document matches
    const documentResults = await db.execute(sql`
      SELECT
        c.id as chunk_id,
        c.content as chunk_content,
        c.order as chunk_order,
        c.metadata as chunk_metadata,
        d.id as document_id,
        d.name as document_name,
        d.metadata as document_metadata,
        e.embedding <-> ${embeddingArray}::vector as distance,
        'document' as source_type
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN embeddings e ON c.id = e.chunk_id
      WHERE e.embedding IS NOT NULL
      ORDER BY e.embedding <-> ${embeddingArray}::vector
      LIMIT ${Math.floor(limit / 2)}
    `);

    let conversationResults: any[] = [];

    // If chatId provided, also search conversation history
    if (chatId) {
      conversationResults = await db.execute(sql`
        SELECT
          m.id as message_id,
          m.content as message_content,
          m.role as message_role,
          m.created_at as message_created_at,
          m.parent_id as message_parent_id,
          NULL as distance,
          'conversation' as source_type
        FROM message m
        WHERE m.chat_id = ${chatId}
        AND m.role = 'assistant'
        ORDER BY m.created_at DESC
        LIMIT ${Math.floor(limit / 2)}
      `);
    }

    // Combine and rank results
    const allResults = [
      ...documentResults.map((row: any) => ({
        type: 'document',
        chunkId: row.chunk_id as number,
        content: row.chunk_content as string,
        order: row.chunk_order as number,
        chunkMetadata: row.chunk_metadata,
        documentId: row.document_id as number,
        documentName: row.document_name as string,
        documentMetadata: row.document_metadata,
        distance: row.distance as number,
        messageId: null,
        messageRole: null,
        messageCreatedAt: null,
        messageParentId: null
      })),
      ...conversationResults.map((row: any) => ({
        type: 'conversation',
        chunkId: null,
        content: row.message_content as string,
        order: null,
        chunkMetadata: null,
        documentId: null,
        documentName: null,
        documentMetadata: null,
        distance: 0.5, // Default distance for conversation results
        messageId: row.message_id as string,
        messageRole: row.message_role as string,
        messageCreatedAt: row.message_created_at,
        messageParentId: row.message_parent_id
      }))
    ];

    // Sort by distance (lower is better)
    allResults.sort((a, b) => a.distance - b.distance);

    return allResults.slice(0, limit);
  } catch (error) {
    console.error('Enhanced vector search error:', error);
    return [];
  }
}

/**
 * Create message embedding for RAG
 */
export async function createMessageEmbedding(messageId: string, embedding: number[]): Promise<any> {
  try {
    // For now, we'll store message embeddings in a simple way
    // In a production system, you might want a separate table for message embeddings
    const embeddingArray = `[${embedding.join(',')}]`;

    // You could add this to the message metadata or create a separate table
    // For now, let's just log it
    console.log(`Message embedding created for ${messageId}: ${embeddingArray}`);

    return { messageId, embedding: embeddingArray };
  } catch (error) {
    console.error('Error creating message embedding:', error);
    throw error;
  }
}

/**
 * Search conversation branches for relevant context
 */
export async function searchConversationBranches(
  chatId: string,
  query: string,
  limit: number = 3
): Promise<any[]> {
  try {
    // Search for branches that contain relevant content
    const results = await db.execute(sql`
      SELECT
        cb.id as branch_id,
        cb.branch_name as branch_name,
        cb.description as branch_description,
        cb.root_message_id as root_message_id,
        m.content as root_content,
        COUNT(m2.id) as message_count
      FROM conversation_branch cb
      JOIN message m ON cb.root_message_id = m.id
      LEFT JOIN message m2 ON m2.parent_id = m.id OR m2.id = m.id
      WHERE cb.chat_id = ${chatId}
      AND (
        cb.branch_name ILIKE ${`%${query}%`} OR
        cb.description ILIKE ${`%${query}%`} OR
        m.content ILIKE ${`%${query}%`}
      )
      GROUP BY cb.id, cb.branch_name, cb.description, cb.root_message_id, m.content
      ORDER BY message_count DESC
      LIMIT ${limit}
    `);

    return results.map((row: any) => ({
      branchId: row.branch_id,
      branchName: row.branch_name,
      description: row.branch_description,
      rootMessageId: row.root_message_id,
      rootContent: row.root_content,
      messageCount: row.message_count
    }));
  } catch (error) {
    console.error('Error searching conversation branches:', error);
    return [];
  }
}

/**
 * Get branch hierarchy for a chat
 */
export async function getBranchHierarchy(chatId: string) {
  try {
    const results = await db.execute(sql`
      WITH RECURSIVE branch_tree AS (
        -- Get root messages (no parent)
        SELECT
          m.id,
          m.content,
          m.parent_id,
          m.role,
          m.created_at,
          0 as depth,
          m.id as root_id,
          ARRAY[m.id] as path
        FROM message m
        WHERE m.chat_id = ${chatId} AND m.parent_id IS NULL

        UNION ALL

        -- Get child messages recursively
        SELECT
          m.id,
          m.content,
          m.parent_id,
          m.role,
          m.created_at,
          bt.depth + 1,
          bt.root_id,
          bt.path || m.id
        FROM message m
        JOIN branch_tree bt ON m.parent_id = bt.id
        WHERE m.chat_id = ${chatId}
      )
      SELECT
        id,
        content,
        parent_id,
        role,
        created_at,
        depth,
        root_id,
        path
      FROM branch_tree
      ORDER BY root_id, depth, created_at
    `);

    // Group by root message to create branch structure
    const branches: { [rootId: string]: any[] } = {};
    results.forEach((row: any) => {
      const rootId = row.root_id;
      if (!branches[rootId]) {
        branches[rootId] = [];
      }
      branches[rootId].push({
        id: row.id,
        content: row.content,
        parentId: row.parent_id,
        role: row.role,
        createdAt: row.created_at,
        depth: row.depth,
        path: row.path
      });
    });

    return Object.values(branches);
  } catch (error) {
    console.error('Error getting branch hierarchy:', error);
    return [];
  }
}

/**
 * Generate conversation summary using embeddings
 */
export async function generateConversationSummary(chatId: string): Promise<string> {
  try {
    // Get all messages in chronological order
    const messages = await db.execute(sql`
      SELECT
        m.id,
        m.content,
        m.role,
        m.created_at,
        m.parent_id
      FROM message m
      WHERE m.chat_id = ${chatId}
      ORDER BY m.created_at ASC
    `);

    if (messages.length === 0) {
      return "No conversation history available.";
    }

    // Create a simple summary based on message patterns
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const assistantMessages = messages.filter((m: any) => m.role === 'assistant');

    const topics = extractTopics(userMessages);
    const summary = `Conversation with ${userMessages.length} user messages and ${assistantMessages.length} assistant responses. Main topics discussed: ${topics.join(', ')}.`;

    return summary;
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return "Unable to generate summary.";
  }
}

/**
 * Extract topics from user messages (simple keyword extraction)
 */
function extractTopics(userMessages: any[]): string[] {
  const keywords = new Set<string>();
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'who', 'can', 'could', 'would', 'should', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);

  userMessages.forEach((msg: any) => {
    const words = msg.content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word: string) => word.length > 3 && !stopWords.has(word));

    words.forEach((word: string) => {
      if (word.length > 3) {
        keywords.add(word);
      }
    });
  });

  return Array.from(keywords).slice(0, 5); // Return top 5 keywords
}

/**
 * Clean up old embeddings and optimize vector search
 */
export async function optimizeVectorStorage(): Promise<{ deleted: number; optimized: boolean }> {
  try {
    // Remove embeddings for deleted chunks
    const deletedEmbeddings = await db.execute(sql`
      DELETE FROM embeddings
      WHERE chunk_id NOT IN (SELECT id FROM chunks)
    `);

    // Remove chunks for deleted documents
    const deletedChunks = await db.execute(sql`
      DELETE FROM chunks
      WHERE document_id NOT IN (SELECT id FROM documents)
    `);

    return {
      deleted: (deletedEmbeddings.length || 0) + (deletedChunks.length || 0),
      optimized: true
    };
  } catch (error) {
    console.error('Error optimizing vector storage:', error);
    return { deleted: 0, optimized: false };
  }
}
