import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ragService } from '$lib/server/rag';
import { getServerSession } from '@auth/sveltekit';
import { auth } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await ragService.getUserDocuments(session.user.id);
    return json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file || !name) {
      return json({ error: 'File and name are required' }, { status: 400 });
    }

    // Read file content
    const content = await file.text();
    
    // Extract metadata
    const metadata = {
      filename: file.name,
      fileType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    const result = await ragService.ingestDocument(
      session.user.id,
      name,
      content,
      metadata
    );

    return json({ success: true, ...result });
  } catch (error) {
    console.error('Error uploading document:', error);
    return json({ error: 'Failed to upload document' }, { status: 500 });
  }
};
