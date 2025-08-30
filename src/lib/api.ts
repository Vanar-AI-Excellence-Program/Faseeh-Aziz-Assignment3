/**
 * API helper functions for making requests to backend endpoints
 */

/**
 * Send chat messages to the chat API
 * @param messages Array of chat messages
 * @returns Parsed JSON response from the chat API
 */
export async function sendChat(messages: any[]) {
  try {
    console.log('🔍 Before sendChat call - Request body:', { messages });
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ After sendChat call - Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in sendChat:', error);
    throw error;
  }
}

/**
 * Send chat messages to the RAG-enhanced chat API
 * @param messages Array of chat messages
 * @returns Parsed JSON response from the RAG chat API with context and citations
 */
export async function sendRAGChat(messages: any[]) {
  try {
    console.log('🔍 Before sendRAGChat call - Request body:', { messages });
    
    const response = await fetch('/api/chat-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`RAG Chat API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ After sendRAGChat call - Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in sendRAGChat:', error);
    throw error;
  }
}

/**
 * Get embedding for a text string
 * @param text Text to generate embedding for
 * @returns Parsed JSON response with embedding data
 */
export async function getEmbedding(text: string) {
  try {
    console.log('🔍 Before getEmbedding call - Request body:', { text });
    
    const response = await fetch('/api/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ After getEmbedding call - Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in getEmbedding:', error);
    throw error;
  }
}
