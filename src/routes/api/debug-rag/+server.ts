import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents, chunks, embeddings } from '$lib/server/db/schema';
import { findSimilarChunks, checkVectorExtension, getDatabaseStats } from '$lib/server/db/vector-utils';
import { generateEmbedding } from '$lib/ai/embeddings';
import { env } from '$env/dynamic/private';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database statistics
    const stats = await getDatabaseStats();
    
    // Check vector extension
    const vectorExtensionAvailable = await checkVectorExtension();
    
    // Get all documents
    const allDocuments = await db.select().from(documents);
    
    // Get all chunks
    const allChunks = await db.select().from(chunks);
    
    // Get all embeddings
    const allEmbeddings = await db.select().from(embeddings);
    
    // Test similarity search with a simple query
    let similarityTest = null;
    if (vectorExtensionAvailable && allEmbeddings.length > 0) {
      try {
        const testQuery = "test query";
        const testEmbedding = await generateEmbedding({ text: testQuery });
        const similarChunks = await findSimilarChunks(testEmbedding.embedding, 3);
        similarityTest = {
          query: testQuery,
          embeddingDimensions: testEmbedding.embedding.length,
          results: similarChunks.map(chunk => ({
            documentName: chunk.documentName,
            content: chunk.content.substring(0, 100) + '...',
            distance: chunk.distance
          }))
        };
      } catch (error: any) {
        similarityTest = { error: error.message };
      }
    }

    return json({
      status: 'success',
      vectorExtensionAvailable,
      stats,
      documents: allDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt,
        metadata: doc.metadata
      })),
      chunks: allChunks.map(chunk => ({
        id: chunk.id,
        documentId: chunk.documentId,
        content: chunk.content.substring(0, 50) + '...',
        order: chunk.order
      })),
      embeddings: allEmbeddings.map(emb => ({
        id: emb.id,
        chunkId: emb.chunkId,
        embeddingDimensions: emb.embedding ? 'vector' : 'null'
      })),
      similarityTest
    });

  } catch (error: any) {
    console.error('Debug RAG error:', error);
    return json({ 
      error: 'Debug failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
};
