import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ragService } from '$lib/server/rag';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await ragService.getDocumentStats(session.user.id);
    return json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    return json({ error: 'Failed to fetch document stats' }, { status: 500 });
  }
};
