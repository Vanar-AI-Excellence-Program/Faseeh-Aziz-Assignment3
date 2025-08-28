import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ragService } from '$lib/server/rag';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query) {
      return json({ error: 'Query is required' }, { status: 400 });
    }

    const results = await ragService.searchDocuments(session.user.id, query);
    return json({ success: true, results });
  } catch (error) {
    console.error('Error searching documents:', error);
    return json({ error: 'Failed to search documents' }, { status: 500 });
  }
};
