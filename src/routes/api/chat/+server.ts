import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chat, message, conversationBranch } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { generateText, streamTextGeneration } from '$lib/ai';
import { randomUUID } from 'crypto';
import { branch } from '$lib/server/db/schema';
import { messageBranches } from '$lib/server/db/schema';

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
      // Priority 1: Try OpenAI directly
      if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== '') {
        console.log('🚀 Using OpenAI directly for text generation');
        try {
          aiResponse = await callOpenAI(messages, uploadedFile);
        } catch (openaiError) {
          console.log('❌ OpenAI failed, falling back to Google Gemini');
          // Priority 2: Try Google Generative AI API as fallback
          if (env.GOOGLE_GENERATIVE_AI_API_KEY && env.GOOGLE_GENERATIVE_AI_API_KEY.trim() !== '') {
            console.log('🔄 Using Google Generative AI API as fallback');
            aiResponse = await callGoogleGenerativeAI(messages, uploadedFile);
          } else {
            throw openaiError; // Re-throw if no fallback available
          }
        }
      }
      // Priority 2: Try Google Generative AI API if OpenAI not set
      else if (env.GOOGLE_GENERATIVE_AI_API_KEY && env.GOOGLE_GENERATIVE_AI_API_KEY.trim() !== '') {
        console.log('🔄 OpenAI not available, using Google Generative AI API');
        aiResponse = await callGoogleGenerativeAI(messages, uploadedFile);
      } else {
        console.log('❌ No AI API keys found, using basic responses');
        console.log('Available env vars:', {
          OPENAI_API_KEY: env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
          GOOGLE_GENERATIVE_AI_API_KEY: env.GOOGLE_GENERATIVE_AI_API_KEY ? 'SET' : 'NOT SET'
        });
        // Fall back to basic responses
        aiResponse = generateBasicResponse(messages);
      }
    } catch (error) {
      console.error('AI API error:', error);
      // Fall back to basic response on error
      aiResponse = generateBasicResponse(messages);
    }

    // Save messages to database if chatId is provided
    let savedMessages = [];
    if (chatId && messages.length > 0) {
      try {
        // Check if branch table exists before trying to use it
        let hasBranchTable = false;
        try {
          const branchTableExists = await db.execute(sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'branch'
            )
          `);
          hasBranchTable = (branchTableExists[0] as any)?.exists || false;
        } catch (error) {
          console.log('Could not check if branch table exists, assuming it does not');
          hasBranchTable = false;
        }

        // Only create branches if the table exists AND we're not in a simple chat flow
        let activeBranch = null;
        if (hasBranchTable) {
          // For now, don't create branches automatically - only when editing
          // Just check if any branch exists
          let branchResult = await db.select().from(branch).where(eq(branch.chatId, chatId)).limit(1);
          if (branchResult.length > 0) {
            activeBranch = branchResult[0];
          }
        }

        // Save all user messages that aren't already saved
        for (const msg of messages) {
          if (msg.role === 'user' && !msg.id) {
            let messageValues: any = {
              id: randomUUID(),
              chatId: chatId,
              role: msg.role,
              content: msg.content,
              createdAt: new Date()
            };

            // Only add branchId if branch table exists
            if (activeBranch) {
              messageValues.branchId = activeBranch.id;
              messageValues.parentMessageId = msg.parentMessageId || null;
            }

            const [savedUserMessage] = await db.insert(message).values(messageValues).returning();
            savedMessages.push(savedUserMessage);
          }
        }
        
        // Save the AI response
        let aiMessageValues: any = {
          id: randomUUID(),
          chatId: chatId,
          role: 'assistant',
          content: aiResponse,
          createdAt: new Date()
        };

        // Only add branchId if branch table exists
        if (activeBranch) {
          aiMessageValues.branchId = activeBranch.id;
          aiMessageValues.parentMessageId = messages[messages.length - 1].id || null;
        }

        const [savedAIMessage] = await db.insert(message).values(aiMessageValues).returning();
        savedMessages.push(savedAIMessage);
        
        console.log('✅ Messages saved to database:', savedMessages.length);
      } catch (dbError) {
        console.error('❌ Failed to save messages to database:', dbError);
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

// Add PUT method for message editing and branching
export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    console.log('🔧 PUT /api/chat - Starting message branch creation...');
    
    const session = await locals.auth();
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - No session or user ID');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', session.user.id);

    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { messageId, content } = body;
    
    if (!messageId || !content) {
      console.log('❌ Missing required fields:', { messageId, content });
      return json({ error: 'Message ID and content are required' }, { status: 400 });
    }

    console.log('🔍 Looking for original message:', messageId);

    // Get the original message to verify ownership and get context
    const existingMessage = await db.select().from(message).where(eq(message.id, messageId)).limit(1);
    
    if (existingMessage.length === 0) {
      console.log('❌ Message not found:', messageId);
      return json({ error: 'Message not found' }, { status: 404 });
    }

    const originalMsg = existingMessage[0];
    console.log('✅ Original message found:', { id: originalMsg.id, chatId: originalMsg.chatId, role: originalMsg.role });
    
    // Verify the message belongs to the current user
    if (originalMsg.chatId) {
      console.log('🔍 Verifying chat ownership for chat:', originalMsg.chatId);
      
      // Check if the chat belongs to the current user
      const chatResult = await db.select().from(chat).where(eq(chat.id, originalMsg.chatId)).limit(1);
      console.log('📋 Chat query result:', chatResult);
      
      if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
        console.log('❌ Unauthorized to edit message - Chat not found or wrong user');
        return json({ error: 'Unauthorized to edit this message' }, { status: 403 });
      }
      
      console.log('✅ Chat ownership verified');
    }

    // Only allow editing user messages
    if (originalMsg.role !== 'user') {
      console.log('❌ Cannot edit non-user messages');
      return json({ error: 'Only user messages can be edited' }, { status: 400 });
    }

    console.log('🔄 Creating new message branch...');

    // Check if branch table exists
    let hasBranchTable = false;
    let newBranchId = randomUUID();
    try {
      const branchTableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'branch'
        )
      `);
      hasBranchTable = (branchTableExists[0] as any)?.exists || false;
    } catch (error) {
      console.log('Could not check if branch table exists, assuming it does not');
      hasBranchTable = false;
    }

    let newBranch = null;
    if (hasBranchTable) {
             // Create a new branch for this conversation
       [newBranch] = await db.insert(branch).values({
         id: newBranchId,
         chatId: originalMsg.chatId,
         name: `Branch from "${content.substring(0, 30)}..."`,
         parentBranchId: originalMsg.branchId || null, // Link to the original branch if it exists
         isActive: true,
         createdAt: new Date(),
         updatedAt: new Date()
       }).returning();

             // Deactivate the original branch if it has branchId
       if (originalMsg.branchId) {
         await db.update(branch).set({ isActive: false }).where(eq(branch.id, originalMsg.branchId));
       } else {
         console.log('Original message has no branchId, skipping branch deactivation');
       }
    } else {
      // Fallback: use a simple UUID for branchId if branch table doesn't exist
      newBranchId = randomUUID();
    }

    // Create a new message in the new branch
    const newMessageId = randomUUID();
    
    // Check if the new schema fields exist by querying the information schema
    let hasNewSchema = false;
    try {
      // First, let's see ALL columns in the message table
      const allColumns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'message' 
        AND table_schema = 'public'
        ORDER BY column_name
      `);
      console.log('All columns in message table:', allColumns.map((c: any) => c.column_name));
      
      // Now check for the specific columns we need
      const columns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'message' 
        AND table_schema = 'public'
        AND column_name IN ('branchId', 'parentMessageId', 'chunkCitations')
      `);
      hasNewSchema = columns.length === 3;
      console.log('Schema check result:', { 
        foundColumns: columns.map((c: any) => c.column_name), 
        hasNewSchema,
        expectedColumns: ['branchId', 'parentMessageId', 'chunkCitations']
      });
    } catch (error) {
      console.log('Could not check schema, assuming old schema:', error);
      hasNewSchema = false;
    }

    let messageValues: any = {
      id: newMessageId,
      chatId: originalMsg.chatId,
      role: 'user',
      content: content,
      createdAt: new Date()
    };

    // Add new schema fields only if they exist
    if (hasNewSchema) {
      messageValues.branchId = newBranchId;
      messageValues.parentMessageId = originalMsg.id;
      messageValues.chunkCitations = null;
    } else {
      console.log('Using old schema - no branchId, parentMessageId, or chunkCitations');
    }

    const [newMessage] = await db.insert(message).values(messageValues).returning();

    // Update messageBranches for the original message (only if table exists)
    if (hasNewSchema) {
      try {
        const messageBranchesExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'messageBranches'
          )
        `);
        
        if ((messageBranchesExists[0] as any)?.exists) {
          const existingMessageBranch = await db.select().from(messageBranches)
            .where(eq(messageBranches.messageId, originalMsg.id))
            .limit(1);
          
          if (existingMessageBranch.length > 0) {
            // Update existing record
            await db.update(messageBranches)
              .set({ 
                branchCount: existingMessageBranch[0].branchCount + 1,
                lastUpdated: new Date()
              })
              .where(eq(messageBranches.id, existingMessageBranch[0].id));
          } else {
            // Create new record
            await db.insert(messageBranches).values({
              id: randomUUID(),
              messageId: originalMsg.id,
              branchCount: 1,
              lastUpdated: new Date()
            });
          }
        }
      } catch (error) {
        console.log('Could not update messageBranches, skipping');
      }
    }

    console.log('✅ New message branch created successfully:', { branch: newBranch, message: newMessage });

    return json({
      success: true,
      branch: newBranch,
      message: newMessage,
      originalMessageId: originalMsg.id,
      isBranch: true
    });

  } catch (error: any) {
    console.error('❌ Error creating message branch:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    
    return json({ 
      error: 'Failed to create message branch',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
};

// OpenAI integration (Priority 1)
async function callOpenAI(messages: any[], file: File | null): Promise<string> {
  try {
    // Convert messages to a single prompt
    const conversation = messages.map(msg => 
      `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`
    ).join('\n\n');

    // Add file context if available
    let fullPrompt = conversation;
    if (file) {
      fullPrompt = `I have uploaded a file: ${file.name}. Please consider this context when responding.\n\n${conversation}`;
    }

    // Add system prompt
    const systemPrompt = `You are a helpful AI programming assistant. Always respond using proper markdown formatting including:

- Use **bold** for emphasis and important terms
- Use *italic* for code concepts and file names
- Use \`inline code\` for code snippets, variables, and commands
- Use \`\`\`language\ncode blocks\n\`\`\` for longer code examples
- Use # ## ### for headers to organize your responses
- Use - or * for bullet points in lists
- Use > for blockquotes when referencing or explaining concepts
- Use [link text](url) for any relevant links
- Structure your responses with clear sections using headers

Make your responses well-formatted and easy to read.`;

    const finalPrompt = `${systemPrompt}\n\n${fullPrompt}`;

    const result = await generateText({
      prompt: finalPrompt,
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7
    });

    return result.text;
  } catch (error) {
    console.error('OpenAI API failed:', error);
    throw error;
  }
}

// Google Generative AI API integration (Priority 2)
async function callGoogleGenerativeAI(messages: any[], file: File | null): Promise<string> {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('Google Generative AI API key not configured');

  // Convert messages to Google's format
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add system prompt to ensure markdown formatting
  const systemPrompt = {
    role: 'user',
    parts: [{ text: `You are a helpful AI programming assistant. Always respond using proper markdown formatting including:

- Use **bold** for emphasis and important terms
- Use *italic* for code concepts and file names
- Use \`inline code\` for code snippets, variables, and commands
- Use \`\`\`language\ncode blocks\n\`\`\` for longer code examples
- Use # ## ### for headers to organize your responses
- Use - or * for bullet points in lists
- Use > for blockquotes when referencing or explaining concepts
- Use [link text](url) for any relevant links
- Structure your responses with clear sections using headers

Make your responses well-formatted and easy to read.` }]
  };

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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
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
I'm currently using **basic responses** while the AI API is being configured. 

## What I Can Help With
Even in basic mode, I can assist with:
- **Basic programming concepts**
- **Code examples** and templates
- **Algorithm explanations**
- **Language-specific syntax**
- **Common programming patterns**

## Getting Started
What specific programming help do you need? I'll do my best to assist you!`;
  }
}


