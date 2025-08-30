import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateText } from '$lib/ai';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Messages are required' }, { status: 400 });
    }

    // Convert messages to a single prompt
    const conversation = messages.map(msg => 
      `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`
    ).join('\n\n');

    // Add system prompt
    const systemPrompt = `You are a helpful AI assistant. Please respond to the user's message in a helpful and informative way.`;
    const finalPrompt = `${systemPrompt}\n\n${conversation}`;

    const result = await generateText({
      prompt: finalPrompt,
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7
    });

    return json({ reply: { content: result.text } });
    
  } catch (err: any) {
    console.error('Chat error:', err);
    return json({ error: 'Chat failed' }, { status: 500 });
  }
};
