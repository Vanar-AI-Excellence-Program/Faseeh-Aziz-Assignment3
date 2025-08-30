import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateEmbedding } from '$lib/ai/embeddings';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { text } = await request.json();

    if (!text) {
      return json({ error: 'Text is required' }, { status: 400 });
    }

    const result = await generateEmbedding({ text });
    
    return json({ embedding: result.embedding });
    
  } catch (err: any) {
    console.error('Embed error:', err);
    return json({ error: 'Embedding failed' }, { status: 500 });
  }
};
