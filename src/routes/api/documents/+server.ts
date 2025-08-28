import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ragService } from '$lib/server/rag';
import { getServerSession } from '@auth/sveltekit';

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

    // Validate file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const supportedTypes = ['txt', 'pdf'];
    
    if (!fileExtension || !supportedTypes.includes(fileExtension)) {
      return json({ 
        error: 'Unsupported file type. Please upload .txt or .pdf files only.' 
      }, { status: 400 });
    }

    let content: string;
    let fileType: string;

    // Extract content based on file type
    if (fileExtension === 'pdf') {
      // Temporarily disable PDF support due to import issues
      return json({ 
        error: 'PDF upload is temporarily disabled. Please upload .txt files only.' 
      }, { status: 400 });
    } else {
      // Handle text files (existing functionality)
      content = await file.text();
      fileType = 'txt';
      
      // Validate text content
      if (!content || content.trim().length === 0) {
        return json({ error: 'Text file appears to be empty' }, { status: 400 });
      }
    }
    
    // Extract metadata
    const metadata = {
      filename: file.name,
      fileType: file.type,
      originalFileType: fileType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    const result = await ragService.ingestDocument(
      session.user.id,
      name,
      content,
      metadata
    );

    return json({ 
      success: true, 
      fileType: fileType,
      chunksInserted: result.chunksCreated,
      ...result 
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return json({ error: 'Failed to upload document' }, { status: 500 });
  }
};

