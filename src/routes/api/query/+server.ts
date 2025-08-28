import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ragService } from '$lib/server/rag';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, limit = 5 } = await request.json();

    if (!query) {
      return json({ error: 'Query is required' }, { status: 400 });
    }

    const results = await ragService.searchChunks(session.user.id, query, limit);
    
    // Format results for AI chat model context
    const context = results.map((result, index) => ({
      document: result.documentName,
      content: result.text,
      similarity: result.similarity,
      metadata: result.metadata
    }));

    return json({ 
      success: true, 
      query,
      results: context,
      totalResults: results.length
    });
  } catch (error) {
    console.error('Error querying RAG system:', error);
    return json({ error: 'Failed to query RAG system' }, { status: 500 });
  }
};
