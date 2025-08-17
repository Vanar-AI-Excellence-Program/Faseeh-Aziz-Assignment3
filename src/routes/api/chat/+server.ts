import type { RequestHandler } from '@sveltejs/kit';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '$env/dynamic/private';
import { GOOGLE_GENERATIVE_AI_API_KEY as STATIC_GEMINI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    let fileContent = '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const messagesStr = formData.get('messages') as string;
      const file = formData.get('file') as File;
      
      if (messagesStr) {
        messages = JSON.parse(messagesStr);
      }
      
      if (file) {
        if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
          fileContent = await file.text();
        } else {
          fileContent = `[File uploaded: ${file.name} (${file.type}, ${file.size} bytes)]`;
        }
        
        // Add file content to the last user message
        if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
          messages[messages.length - 1].content += `\n\nAttached file: ${fileContent}`;
        }
      }
    } else {
      // Handle JSON
      const body = await request.json().catch(() => ({ messages: [] }));
      messages = body.messages ?? [];
    }

    const apiKey =
      STATIC_GEMINI_API_KEY ||
      env.GOOGLE_GENERATIVE_AI_API_KEY ||
      (process.env as any).GOOGLE_GENERATIVE_AI_API_KEY ||
      env.GOOGLE_API_KEY ||
      (process.env as any).GOOGLE_API_KEY ||
      env.GEMINI_API_KEY ||
      (process.env as any).GEMINI_API_KEY ||
      undefined;

    // Temporary debug log (server console). Remove after verifying.
    console.log('Chat API key present:', Boolean(apiKey));

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "Google Generative AI API key is missing. Set 'GOOGLE_GENERATIVE_AI_API_KEY' (preferred) or one of: GOOGLE_API_KEY, GEMINI_API_KEY in AuthApp/.env, then restart the dev server."
        }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const model = google('models/gemini-1.5-flash');

    const result = await streamText({
      model,
      messages,
      system:
        'You are a helpful AI assistant. Provide concise, accurate, and helpful responses to any questions or requests. Be conversational and friendly.',
    });

    const stream = result.toAIStreamResponse();
    return stream;
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};


