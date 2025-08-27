import { db } from '$lib/server/db';
import { documents, chunks, embeddings } from '../../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const EMBEDDING_API_URL = env.EMBEDDING_API_URL || 'http://localhost:8001';

export interface DocumentMetadata {
  filename?: string;
  fileType?: string;
  size?: number;
  uploadedAt?: string;
  [key: string]: any;
}

export interface ChunkMetadata {
  chunkIndex: number;
  startChar: number;
  endChar: number;
  [key: string]: any;
}

export class RAGService {
  /**
   * Ingest a document by chunking it and generating embeddings
   */
  async ingestDocument(
    userId: string,
    name: string,
    content: string,
    metadata: DocumentMetadata = {}
  ) {
    try {
      // Create document record
      const documentId = crypto.randomUUID();
      await db.insert(documents).values({
        id: documentId,
        userId,
        name,
        metadata: JSON.stringify(metadata),
      });

      // Chunk the content
      const textChunks = this.chunkText(content);
      
      // Generate embeddings for chunks
      const chunkRecords = [];
      const embeddingRequests = [];

      for (let i = 0; i < textChunks.length; i++) {
        const chunkId = crypto.randomUUID();
        const chunk = textChunks[i];
        
        chunkRecords.push({
          id: chunkId,
          documentId,
          text: chunk,
          metadata: JSON.stringify({
            chunkIndex: i,
            startChar: i * 1000, // Approximate
            endChar: (i + 1) * 1000,
          } as ChunkMetadata),
        });

        embeddingRequests.push({
          text: chunk,
        });
      }

      // Insert chunks
      await db.insert(chunks).values(chunkRecords);

      // Generate embeddings in batch
      const embeddingsResponse = await this.generateEmbeddings(embeddingRequests);
      
      if (!embeddingsResponse.embeddings) {
        throw new Error('Failed to generate embeddings');
      }

      // Insert embeddings
      const embeddingRecords = embeddingsResponse.embeddings.map((embedding, i) => ({
        id: crypto.randomUUID(),
        chunkId: chunkRecords[i].id,
        vector: embedding,
      }));

      await db.insert(embeddings).values(embeddingRecords);

      return {
        documentId,
        chunksCreated: textChunks.length,
        embeddingsCreated: embeddingRecords.length,
      };
    } catch (error) {
      console.error('Error ingesting document:', error);
      throw error;
    }
  }

  /**
   * Search for relevant chunks using vector similarity
   */
  async searchChunks(userId: string, query: string, limit: number = 5) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      if (!queryEmbedding.embedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Search for similar chunks using cosine similarity
      const results = await db
        .select({
          chunkId: chunks.id,
          text: chunks.text,
          metadata: chunks.metadata,
          documentId: chunks.documentId,
          documentName: documents.name,
          similarity: sql<number>`vector_cosine_similarity(${embeddings.vector}, ${queryEmbedding.embedding})`,
        })
        .from(embeddings)
        .innerJoin(chunks, eq(embeddings.chunkId, chunks.id))
        .innerJoin(documents, eq(chunks.documentId, documents.id))
        .where(eq(documents.userId, userId))
        .orderBy(sql`vector_cosine_similarity(${embeddings.vector}, ${queryEmbedding.embedding}) DESC`)
        .limit(limit);

      return results.map(result => ({
        ...result,
        metadata: JSON.parse(result.metadata || '{}'),
      }));
    } catch (error) {
      console.error('Error searching chunks:', error);
      throw error;
    }
  }

  /**
   * Get documents for a user
   */
  async getUserDocuments(userId: string) {
    try {
      const userDocs = await db
        .select({
          id: documents.id,
          name: documents.name,
          metadata: documents.metadata,
          createdAt: documents.createdAt,
          chunkCount: sql<number>`(
            SELECT COUNT(*) FROM ${chunks} 
            WHERE ${chunks.documentId} = ${documents.id}
          )`,
        })
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(documents.createdAt);

      return userDocs.map(doc => ({
        ...doc,
        metadata: JSON.parse(doc.metadata || '{}'),
      }));
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw error;
    }
  }

  /**
   * Delete a document and all its chunks/embeddings
   */
  async deleteDocument(userId: string, documentId: string) {
    try {
      // Verify ownership
      const document = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId) && eq(documents.userId, userId))
        .limit(1);

      if (!document.length) {
        throw new Error('Document not found or access denied');
      }

      // Delete will cascade to chunks and embeddings
      await db.delete(documents).where(eq(documents.id, documentId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Chunk text into smaller pieces for better retrieval
   */
  private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to break at sentence boundaries
      if (end < text.length) {
        const nextPeriod = text.indexOf('.', end - 100);
        const nextNewline = text.indexOf('\n', end - 100);
        
        if (nextPeriod > end - 100 && nextPeriod < end + 100) {
          end = nextPeriod + 1;
        } else if (nextNewline > end - 100 && nextNewline < end + 100) {
          end = nextNewline + 1;
        }
      }

      chunks.push(text.slice(start, end).trim());
      start = end - overlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Generate embedding for a single text
   */
  private async generateEmbedding(text: string) {
    try {
      const response = await fetch(`${EMBEDDING_API_URL}/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  private async generateEmbeddings(texts: { text: string }[]) {
    try {
      const response = await fetch(`${EMBEDDING_API_URL}/embed/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(texts),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }
}

export const ragService = new RAGService();
