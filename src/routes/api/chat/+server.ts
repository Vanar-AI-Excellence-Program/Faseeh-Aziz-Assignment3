import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chat, message, chatMessages, chatBranches, messageBranches } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { ragService } from '$lib/server/rag';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if request has been aborted
    if (request.signal?.aborted) {
      return json({ error: 'Request was aborted' }, { status: 499 });
    }

    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    let messages: any[] = [];
    let chatId: string | null = null;
    let branchId: string | null = null;
    let uploadedFile: File | null = null;

    // Check content type and handle accordingly
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle form data (when file is uploaded)
      const formData = await request.formData();
      const messagesData = formData.get('messages');
      const branchIdData = formData.get('branchId');
      uploadedFile = formData.get('file') as File || null;
      
      if (!messagesData) {
        return json({ error: 'Missing messages' }, { status: 400 });
      }

      messages = JSON.parse(messagesData as string);
      branchId = branchIdData as string || null;
      
      // Extract chatId from the first message if available
      if (messages.length > 0 && messages[0].chatId) {
        chatId = messages[0].chatId;
      }
    } else if (contentType.includes('application/json')) {
      // Handle JSON data
      const body = await request.json();
      messages = body.messages || [];
      branchId = body.branchId || null;
      
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
    let citations: any[] = [];
    
    try {
      // Check if we have Google Generative AI API key
      if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.log('Using Google Generative AI API');
        // Use Google Generative AI API
        const aiResult = await callGoogleGenerativeAI(messages, uploadedFile, session.user.id);
        aiResponse = aiResult.response;
        citations = aiResult.citations;
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

    // Save messages to database using new schema
    if (chatId && messages.length > 0) {
      try {
        const userId = session.user.id;
        
        // Determine which branch to save to
        const targetBranchId = branchId || `main_${chatId}`;
        
        // Ensure we have the target branch for this conversation
        await db.insert(chatBranches).values({
          id: targetBranchId,
          userId: userId,
          conversationId: chatId,
          branchName: branchId ? 'Branch' : 'Main',
          createdAt: new Date(),
          isActive: true
        }).onConflictDoNothing();

        // Save user messages to new chatMessages table
        for (const msg of messages) {
          // Skip messages with missing required fields
          if (!msg.role || !msg.content) {
            console.log('Skipping message with missing required fields:', msg);
            continue;
          }

          // Generate IDs for the message
          const originalMessageId = msg.id || Math.random().toString(36).substring(2, 15);
          const dbMessageId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          
          // Find the database message ID for the parent message if it exists
          let parentMessageId = null;
          if (msg.parentId) {
            const parentDbMessage = await db
              .select()
              .from(chatMessages)
              .where(and(
                eq(chatMessages.originalMessageId, msg.parentId),
                eq(chatMessages.conversationId, chatId)
              ))
              .limit(1);
            
            if (parentDbMessage.length > 0) {
              parentMessageId = parentDbMessage[0].id;
            }
          }
          
          // Insert the message
          await db.insert(chatMessages).values({
            id: dbMessageId,
            userId: userId,
            conversationId: chatId,
            parentMessageId: parentMessageId,
            originalMessageId: originalMessageId,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(),
            createdAt: new Date()
          });

          // Assign message to the target branch
          await db.insert(messageBranches).values({
            id: Math.random().toString(36).substring(2, 15),
            messageId: dbMessageId,
            branchId: targetBranchId,
            conversationId: chatId,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        // Save AI response
        const aiMessageId = Math.random().toString(36).substring(2, 15);
        const aiDbMessageId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        // Get the last user message to set as parent for AI response
        const lastUserMessage = messages[messages.length - 1];
        // Find the database message ID for the last user message
        let parentMessageId = null;
        if (lastUserMessage && lastUserMessage.id) {
          // Look up the database message ID for this original message ID
          const dbMessage = await db
            .select()
            .from(chatMessages)
            .where(and(
              eq(chatMessages.originalMessageId, lastUserMessage.id),
              eq(chatMessages.conversationId, chatId)
            ))
            .limit(1);
          
          if (dbMessage.length > 0) {
            parentMessageId = dbMessage[0].id;
          }
        }
        
        // Insert AI response message
        await db.insert(chatMessages).values({
          id: aiDbMessageId,
          userId: userId,
          conversationId: chatId,
          parentMessageId: parentMessageId,
          originalMessageId: aiMessageId,
          role: 'assistant',
          content: aiResponse,
          chunkCitations: citations.length > 0 ? JSON.stringify(citations) : null,
          timestamp: new Date(),
          createdAt: new Date()
        });

        // Assign AI response to the target branch
        await db.insert(messageBranches).values({
          id: Math.random().toString(36).substring(2, 15),
          messageId: aiDbMessageId,
          branchId: targetBranchId,
          conversationId: chatId,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
      } catch (error) {
        console.error('Error saving messages to database:', error);
        // Continue even if saving fails
      }
    }

    // Create a streaming response
    const stream = new ReadableStream({
      start(controller) {
        // Simulate streaming by sending the response in chunks
        const words = aiResponse.split(' ');
        let index = 0;
        let isAborted = false;
        
        const sendChunk = () => {
          // Check if the stream has been aborted
          if (isAborted || index >= words.length) {
            try {
              controller.close();
            } catch (e) {
              // Ignore errors when closing an already closed controller
            }
            return;
          }
          
          try {
            const chunk = words[index] + ' ';
            controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(chunk)}\n`));
            index++;
            
            // Check if we should continue or if request was aborted
            if (index < words.length) {
              setTimeout(sendChunk, 100); // Simulate typing delay
            } else {
              try {
                controller.close();
              } catch (e) {
                // Ignore errors when closing an already closed controller
              }
            }
          } catch (error) {
            // If enqueue fails (stream closed), stop sending chunks
            console.log('Stream closed, stopping chunks');
            isAborted = true;
            try {
              controller.close();
            } catch (e) {
              // Ignore errors when closing an already closed controller
            }
          }
        };
        
        sendChunk();
        
        // Handle stream cancellation
        return () => {
          isAborted = true;
        };
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
async function callGoogleGenerativeAI(messages: any[], file: File | null, userId: string): Promise<{ response: string; citations: any[] }> {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('Google Generative AI API key not configured');

  // Get the latest user message for RAG search
  const latestUserMessage = messages.filter(m => m.role === 'user').pop();
  let ragContext = '';
  let citations: any[] = [];

  // Perform RAG search if we have a user message
  if (latestUserMessage && userId) {
    try {
      const searchResults = await ragService.searchChunks(userId, latestUserMessage.content, 3);
      if (searchResults && searchResults.length > 0) {
        ragContext = '\n\n## Relevant Context from Your Knowledge Base:\n\n';
        citations = searchResults.map((result, index) => {
          ragContext += `**Document ${index + 1}**: ${result.documentName}\n`;
          ragContext += `**Content**: ${result.text}\n\n`;
          return {
            document: result.documentName,
            text: result.text,
            similarity: result.similarity
          };
        });
      }
    } catch (error) {
      console.error('RAG search error:', error);
      // Continue without RAG context if search fails
    }
  }

  // Convert messages to Google's format
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add system prompt to ensure markdown formatting and RAG integration
  const systemPrompt = {
    role: 'user',
    parts: [{ text: `You are a helpful AI programming assistant with access to the user's knowledge base. Always respond using proper markdown formatting including:

- Use **bold** for emphasis and important terms
- Use *italic* for code concepts and file names
- Use \`inline code\` for code snippets, variables, and commands
- Use \`\`\`language\ncode blocks\n\`\`\` for longer code examples
- Use # ## ### for headers to organize your responses
- Use - or * for bullet points in lists
- Use > for blockquotes when referencing or explaining concepts
- Use [link text](url) for any relevant links
- Structure your responses with clear sections using headers

When you use information from the user's knowledge base, cite the source document at the end of your response.

Make your responses well-formatted and easy to read.` }]
  };

  // Add RAG context if available
  if (ragContext) {
    contents.unshift({
      role: 'user',
      parts: [{ text: ragContext }]
    });
  }

  // Add file context if available
  if (file) {
    contents.unshift({
      role: 'user',
      parts: [{ text: `I have uploaded a file: ${file.name}. Please consider this context when responding.` }]
    });
  }

  // Add system prompt at the beginning
  contents.unshift(systemPrompt);

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
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
  
  // Add citations to the response if we have any
  let finalResponse = responseText;
  if (citations.length > 0) {
    finalResponse += '\n\n---\n\n**Sources:**\n';
    citations.forEach((citation, index) => {
      finalResponse += `${index + 1}. **${citation.document}** (similarity: ${(citation.similarity * 100).toFixed(1)}%)\n`;
    });
  }
  
  return { response: finalResponse, citations };
}

// Fallback basic response generator
function generateBasicResponse(messages: any[]): string {
  const userMessage = messages.find(m => m.role === 'user');
  if (!userMessage) return 'I received your message. How can I help you?';

  const userQuery = userMessage.content.toLowerCase().trim();
  
  // Handle specific programming questions
  if (userQuery.includes('swap') && userQuery.includes('cpp')) {
    return `# C++ Variable Swapping Methods

Here are **three different approaches** to swap two variables in C++:

## Method 1: Using a Temporary Variable
This is the **most common and readable** approach:

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

## Method 2: Using XOR (Bitwise)
This method is **memory-efficient** but only works with integers:

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

## Method 3: Using std::swap (C++ Standard Library)
This is the **most modern and recommended** approach in C++11 and later:

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

## Summary
- **Method 1** (temporary variable): Most readable and widely used
- **Method 2** (XOR): Memory-efficient but integer-only
- **Method 3** (std::swap): Modern, standard library approach

> **Tip**: For production code, prefer **Method 1** for clarity or **Method 3** for modern C++ standards.`;
  } else if (userQuery === 'hi' || userQuery === 'hello' || userQuery.includes('hi') || userQuery.includes('hello')) {
    return `# Hello! 👋

I'm your **AI programming assistant** and I'm here to help you with:

## What I Can Help With
- **Code examples** in various programming languages
- **Algorithm explanations** and implementations
- **Debugging help** and problem-solving
- **Best practices** and coding standards
- **Code reviews** and optimization tips
- **Framework and library** guidance

## Getting Started
Just ask me any programming question! For example:
- "How do I implement a binary search tree?"
- "What's the difference between \`let\` and \`const\` in JavaScript?"
- "Can you help me debug this Python code?"

What would you like to know today?`;
  } else if (userQuery.includes('help')) {
    return `# How Can I Help You? 🤔

I'm your **dedicated programming assistant** and I'm here to make your coding journey easier!

## My Capabilities
- **Code Generation**: Write code in multiple languages
- **Debugging**: Help identify and fix issues
- **Explanations**: Break down complex concepts
- **Best Practices**: Share industry standards
- **Code Review**: Suggest improvements
- **Problem Solving**: Algorithm design and optimization

## Programming Languages I Know
- **Web**: HTML, CSS, JavaScript, TypeScript
- **Backend**: Python, Node.js, Java, C#, Go
- **Mobile**: React Native, Flutter, Swift, Kotlin
- **Data**: SQL, Python (pandas, numpy), R
- **And many more!**

## Getting the Best Responses
- Be **specific** about your question
- Include **code snippets** when relevant
- Mention the **programming language** you're using
- Describe what you've **already tried**

> **Ready to code?** Just ask your question and I'll provide a detailed, well-formatted response!`;
  } else {
    return `# I Understand Your Question

You're asking about: **"${userMessage.content}"**

## Current Status
I'm currently using **basic responses** since no AI API is configured. To get **intelligent, contextual responses**, please add this environment variable:

\`\`\`bash
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
\`\`\`

## What I Can Still Help With
Even without the AI API, I can assist with:
- **Basic programming concepts**
- **Code examples** and templates
- **Algorithm explanations**
- **Language-specific syntax**
- **Common programming patterns**

## Next Steps
1. **Get a Google AI API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Add it to your environment** variables
3. **Restart your application**

> **In the meantime**: What specific programming help do you need? I'll do my best to assist you!`;
  }
}


