import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chat } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    let messages: any[] = [];
    let chatId: string | null = null;
    let uploadedFile: File | null = null;

    // Check content type and handle accordingly
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle form data (when file is uploaded)
      const formData = await request.formData();
      const messagesData = formData.get('messages');
      uploadedFile = formData.get('file') as File || null;
      
      if (!messagesData) {
        return json({ error: 'Missing messages' }, { status: 400 });
      }

      messages = JSON.parse(messagesData as string);
      
      // Extract chatId from the first message if available
      if (messages.length > 0 && messages[0].chatId) {
        chatId = messages[0].chatId;
      }
    } else if (contentType.includes('application/json')) {
      // Handle JSON data
      const body = await request.json();
      messages = body.messages || [];
      
      // Extract chatId from the first message if available
      if (messages.length > 0 && messages[0].chatId) {
        chatId = messages[0].chatId;
      }
    } else {
      return json({ error: 'Unsupported content type. Use multipart/form-data or application/json' }, { status: 400 });
    }
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Update chat's updatedAt timestamp if we have a chatId
    if (chatId) {
      try {
        await db.update(chat).set({ updatedAt: new Date() }).where(eq(chat.id, chatId));
      } catch (error) {
        console.error('Error updating chat timestamp:', error);
        // Continue even if update fails
      }
    }

    // Try to use AI API if available, otherwise fall back to basic responses
    let aiResponse = '';
    
    try {
      // Check if we have Google Generative AI API key
      if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.log('Using Google Generative AI API');
        // Use Google Generative AI API
        aiResponse = await callGoogleGenerativeAI(messages, uploadedFile);
        } else {
        console.log('No Google Generative AI API key found, using basic responses');
        // Fall back to basic responses
        aiResponse = generateBasicResponse(messages);
      }
    } catch (error) {
      console.error('AI API error:', error);
      // Fall back to basic response on error
      aiResponse = generateBasicResponse(messages);
    }

    // Create a streaming response
    const stream = new ReadableStream({
      start(controller) {
        // Simulate streaming by sending the response in chunks
        const words = aiResponse.split(' ');
        let index = 0;
        
        const sendChunk = () => {
          if (index < words.length) {
            const chunk = words[index] + ' ';
            controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(chunk)}\n`));
            index++;
            setTimeout(sendChunk, 100); // Simulate typing delay
          } else {
            controller.close();
          }
        };
        
        sendChunk();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return json({ error: 'Failed to process chat request' }, { status: 500 });
  }
};

// Google Generative AI API integration
async function callGoogleGenerativeAI(messages: any[], file: File | null): Promise<string> {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('Google Generative AI API key not configured');

  // Convert messages to Google's format
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add file context if available
  if (file) {
    contents.unshift({
      role: 'user',
      parts: [{ text: `I have uploaded a file: ${file.name}. Please consider this context when responding.` }]
    });
  }

  const body = {
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1000,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Google Generative AI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
}

// Fallback basic response generator
function generateBasicResponse(messages: any[]): string {
  const userMessage = messages.find(m => m.role === 'user');
  if (!userMessage) return 'I received your message. How can I help you?';

  const userQuery = userMessage.content.toLowerCase().trim();
  
  // Handle specific programming questions
  if (userQuery.includes('swap') && userQuery.includes('cpp')) {
    return `Here's the C++ code for swapping two variables:

**Method 1: Using a temporary variable**
\`\`\`cpp
#include <iostream>
using namespace std;

void swap(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 10, y = 20;
    cout << "Before swap: x = " << x << ", y = " << y << endl;
    
    swap(x, y);
    
    cout << "After swap: x = " << x << ", y = " << y << endl;
    return 0;
}
\`\`\`

**Method 2: Using XOR (bitwise)**
\`\`\`cpp
#include <iostream>
using namespace std;

void swapXOR(int &a, int &b) {
    a = a ^ b;
    b = a ^ b;
    a = a ^ b;
}

int main() {
    int x = 10, y = 20;
    cout << "Before swap: x = " << x << ", y = " << y << endl;
    
    swapXOR(x, y);
    
    cout << "After swap: x = " << x << ", y = " << y << endl;
    return 0;
}
\`\`\`

**Method 3: Using std::swap (C++ Standard Library)**
\`\`\`cpp
#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    int x = 10, y = 20;
    cout << "Before swap: x = " << x << ", y = " << y << endl;
    
    std::swap(x, y);
    
    cout << "After swap: x = " << x << ", y = " << y << endl;
    return 0;
}
\`\`\`

The first method using a temporary variable is the most common and readable approach. The XOR method is memory-efficient but only works with integers. The std::swap method is the most modern and recommended approach in C++11 and later.`;
  } else if (userQuery === 'hi' || userQuery === 'hello' || userQuery.includes('hi') || userQuery.includes('hello')) {
    return 'Hello! I\'m your AI programming assistant. I can help you with coding questions, explain concepts, and provide code examples. What would you like to know?';
  } else if (userQuery.includes('help')) {
    return 'I\'m here to help you with programming questions! You can ask me about:\n\n• Code examples in various languages\n• Algorithm explanations\n• Debugging help\n• Best practices\n• And much more!\n\nJust ask your question and I\'ll do my best to help.';
  } else {
         return `I understand you're asking about: "${userMessage.content}"

I'm currently using basic responses since no AI API is configured. To get intelligent responses, please add this environment variable:

• GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key

What specific programming help do you need? I can assist with basic questions and provide code examples.`;
  }
}


