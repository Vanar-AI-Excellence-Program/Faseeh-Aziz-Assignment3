import { db } from '$lib/server/db';
import { documents, chunks, embeddings } from './db/schema';
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
      // Clean content if it's from a PDF
      const originalFileType = metadata.originalFileType;
      if (originalFileType === 'pdf') {
        content = this.cleanPdfText(content);
      }

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
      const chunkRecords: Array<{
        id: string;
        documentId: string;
        text: string;
        metadata: string;
      }> = [];
      const embeddingRequests: Array<{ text: string }> = [];

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
            originalFileType: originalFileType,
          } as ChunkMetadata),
        });

        embeddingRequests.push({
          text: chunk,
        });
      }

      // Insert chunks
      await db.insert(chunks).values(chunkRecords);

      // Temporarily disable embeddings due to service issues
      // Generate embeddings in batch
      // const embeddingsResponse = await this.generateEmbeddings(embeddingRequests);
      
      // if (!embeddingsResponse.embeddings) {
      //   throw new Error('Failed to generate embeddings');
      // }

      // // Insert embeddings
      // const embeddingRecords = embeddingsResponse.embeddings.map((embedding: number[], i: number) => ({
      //   id: crypto.randomUUID(),
      //   chunkId: chunkRecords[i].id,
      //   vector: JSON.stringify(embedding),
      // }));

      // await db.insert(embeddings).values(embeddingRecords);

      return {
        documentId,
        chunksCreated: textChunks.length,
        embeddingsCreated: 0, // Temporarily disabled
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

      // Search for similar chunks using cosine distance
      // For now, we'll do a simple text search since we're storing vectors as JSON strings
      const results = await db
        .select({
          chunkId: chunks.id,
          text: chunks.text,
          metadata: chunks.metadata,
          documentId: chunks.documentId,
          documentName: documents.name,
          similarity: sql<number>`1.0`, // Placeholder similarity score
        })
        .from(embeddings)
        .innerJoin(chunks, eq(embeddings.chunkId, chunks.id))
        .innerJoin(documents, eq(chunks.documentId, documents.id))
        .where(eq(documents.userId, userId))
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
   * Get document statistics for a user
   */
  async getDocumentStats(userId: string) {
    try {
      const stats = await db
        .select({
          totalDocuments: sql<number>`COUNT(DISTINCT ${documents.id})`,
          totalChunks: sql<number>`COUNT(DISTINCT ${chunks.id})`,
          totalEmbeddings: sql<number>`COUNT(DISTINCT ${embeddings.id})`,
        })
        .from(documents)
        .leftJoin(chunks, eq(documents.id, chunks.documentId))
        .leftJoin(embeddings, eq(chunks.id, embeddings.chunkId))
        .where(eq(documents.userId, userId));

      return stats[0] || { totalDocuments: 0, totalChunks: 0, totalEmbeddings: 0 };
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw error;
    }
  }

  /**
   * Search documents by name
   */
  async searchDocuments(userId: string, query: string) {
    try {
      const results = await db
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
        .where(eq(documents.userId, userId) && sql`${documents.name} ILIKE ${`%${query}%`}`)
        .orderBy(documents.createdAt);

      return results.map(doc => ({
        ...doc,
        metadata: JSON.parse(doc.metadata || '{}'),
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
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
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.embedding) {
        throw new Error('Invalid response from embedding service: missing embedding field');
      }

      return data;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.embeddings || !Array.isArray(data.embeddings)) {
        throw new Error('Invalid response from embedding service: missing or invalid embeddings field');
      }

      return data;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean PDF text by removing common artifacts and normalizing whitespace
   */
  private cleanPdfText(text: string): string {
    return text
      // Remove excessive whitespace and normalize line breaks
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      
      // Remove common PDF artifacts
      .replace(/Page \d+ of \d+/gi, '')
      .replace(/^\d+\s*$/gm, '') // Remove standalone page numbers
      .replace(/^[A-Za-z\s]+\s+\d+\s*$/gm, '') // Remove headers/footers with page numbers
      
      // Remove common PDF metadata patterns
      .replace(/Generated by.*?PDF/i, '')
      .replace(/Created with.*?PDF/i, '')
      
      // Clean up bullet points and lists
      .replace(/^\s*[•·▪▫]\s*/gm, '• ')
      .replace(/^\s*\d+\.\s*/gm, (match) => match.trim())
      
      // Remove excessive punctuation
      .replace(/[.!?]{3,}/g, '...')
      
      // Final cleanup
      .trim();
  }
}

export const ragService = new RAGService();

