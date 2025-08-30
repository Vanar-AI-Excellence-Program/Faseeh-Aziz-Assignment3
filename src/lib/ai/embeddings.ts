import { embed } from 'ai';

export interface EmbeddingOptions {
  text: string;
  model?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate text embeddings using AI Gateway
 */
export async function generateEmbedding(options: EmbeddingOptions): Promise<EmbeddingResult> {
  const {
    text,
    model = 'text-embedding-ada-002'
  } = options;

  try {
    const result = await embed({
      model,
      value: text
    });

    return {
      embedding: result.embedding,
      usage: undefined // Simplified for now
    };

  } catch (error: any) {
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[], model?: string): Promise<EmbeddingResult[]> {
  try {
    const results = await Promise.all(
      texts.map(text => generateEmbedding({ text, model }))
    );
    return results;
  } catch (error: any) {
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Find most similar text from a list of texts
 */
export async function findMostSimilar(
  queryText: string,
  candidateTexts: string[],
  model?: string
): Promise<{ text: string; similarity: number; index: number }> {
  try {
    // Generate embeddings
    const queryEmbedding = await generateEmbedding({ text: queryText, model });
    const candidateEmbeddings = await generateEmbeddings(candidateTexts, model);

    // Calculate similarities
    let maxSimilarity = -1;
    let mostSimilarIndex = 0;

    for (let i = 0; i < candidateEmbeddings.length; i++) {
      const similarity = cosineSimilarity(queryEmbedding.embedding, candidateEmbeddings[i].embedding);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        mostSimilarIndex = i;
      }
    }

    return {
      text: candidateTexts[mostSimilarIndex],
      similarity: maxSimilarity,
      index: mostSimilarIndex
    };

  } catch (error: any) {
    throw new Error(`Failed to find most similar text: ${error.message}`);
  }
}
