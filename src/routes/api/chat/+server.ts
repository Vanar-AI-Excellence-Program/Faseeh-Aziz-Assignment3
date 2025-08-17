import type { RequestHandler } from '@sveltejs/kit';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '$env/dynamic/private';
import { GOOGLE_GENERATIVE_AI_API_KEY as STATIC_GEMINI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body = await request.json().catch(() => ({ messages: [] }));
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = body.messages ?? [];

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
        'You are an assistant for a SvelteKit app. Provide concise, helpful answers. If asked about the app, you can reference settings, dashboard, and authentication features.',
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


