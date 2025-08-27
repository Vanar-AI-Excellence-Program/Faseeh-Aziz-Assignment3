import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ragService } from '$lib/server/rag';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return json({ error: 'Document ID is required' }, { status: 400 });
    }

    const result = await ragService.deleteDocument(session.user.id, id);
    return json({ success: true, ...result });
  } catch (error) {
    console.error('Error deleting document:', error);
    return json({ error: 'Failed to delete document' }, { status: 500 });
  }
};
