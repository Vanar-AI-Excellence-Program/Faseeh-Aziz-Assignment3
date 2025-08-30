import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message, chat } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { generateText } from '$lib/ai';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    console.log('🔧 POST /api/chat/edit - Starting message edit with AI response...');
    
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, newContent, chatId } = await request.json();
    
    if (!messageId || !newContent || !chatId) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the original message to understand the context
    const originalMessage = await db.select().from(message).where(eq(message.id, messageId)).limit(1);
    
    if (!originalMessage || originalMessage.length === 0) {
      return json({ error: 'Message not found' }, { status: 404 });
    }

    const original = originalMessage[0];
    
    // Verify chat ownership
    const chatResult = await db.select().from(chat).where(eq(chat.id, chatId)).limit(1);
    if (chatResult.length === 0 || chatResult[0].userId !== session.user.id) {
      return json({ error: 'Unauthorized to edit this message' }, { status: 403 });
    }

    // Only allow editing user messages
    if (original.role !== 'user') {
      return json({ error: 'Only user messages can be edited' }, { status: 400 });
    }

    // Create a new edited message as a sibling (same parent)
    const editedMessageId = randomUUID();
    const editedMessage = {
      id: editedMessageId,
      chatId,
      parentId: original.parentId, // Same parent as original
      role: original.role,
      content: newContent,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the edited message
    const [savedEditedMessage] = await db.insert(message).values(editedMessage).returning();

    // Generate AI response to the edited message
    let aiResponse = '';
    
    try {
      // Priority 1: Try OpenAI directly
      if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== '') {
        try {
          aiResponse = await callOpenAI(editedMessage, chatId);
        } catch (openaiError) {
          // Priority 2: Try Google Generative AI API as fallback
          if (env.GOOGLE_GENERATIVE_AI_API_KEY && env.GOOGLE_GENERATIVE_AI_API_KEY.trim() !== '') {
            aiResponse = await callGoogleGenerativeAI(editedMessage, chatId);
          } else {
            throw openaiError;
          }
        }
      }
      // Priority 2: Try Google Generative AI API if OpenAI not set
      else if (env.GOOGLE_GENERATIVE_AI_API_KEY && env.GOOGLE_GENERATIVE_AI_API_KEY.trim() !== '') {
        aiResponse = await callGoogleGenerativeAI(editedMessage, chatId);
      } else {
        aiResponse = generateBasicResponse(editedMessage.content);
      }
    } catch (error) {
      console.error('AI API error:', error);
      aiResponse = generateBasicResponse(editedMessage.content);
    }

    // Create AI response message as sibling to the edited message
    const aiMessageId = randomUUID();
    const aiMessage = {
      id: aiMessageId,
      chatId,
      parentId: editedMessageId, // Parent is the edited message
      role: 'assistant' as const,
      content: aiResponse,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the AI response
    const [savedAIMessage] = await db.insert(message).values(aiMessage).returning();

    return json({ 
      success: true, 
      editedMessage: savedEditedMessage,
      aiResponse: savedAIMessage
    });

  } catch (error: any) {
    console.error('Error editing message:', error);
    return json({ 
      error: 'Failed to edit message',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
};

// OpenAI integration (Priority 1)
async function callOpenAI(editedMessage: any, chatId: string): Promise<string> {
  try {
    // Get conversation context for the edited message
    const contextMessages = await getConversationContext(chatId, editedMessage.parentId);
    
    // Add the edited message to the context
    const conversation = [
      ...contextMessages,
      `User: ${editedMessage.content}`
    ].join('\n\n');

    // Add system prompt
    const systemPrompt = `You are a helpful AI programming assistant. The user has edited a message in our conversation. Please respond naturally to the edited content, maintaining context with the conversation history. Always use proper markdown formatting including:

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

    const finalPrompt = `${systemPrompt}\n\n${conversation}`;

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
async function callGoogleGenerativeAI(editedMessage: any, chatId: string): Promise<string> {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('Google Generative AI API key not configured');

  // Get conversation context for the edited message
  const contextMessages = await getConversationContext(chatId, editedMessage.parentId);
  
  // Add the edited message to the context
  const messages = [
    ...contextMessages,
    {
      role: editedMessage.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: editedMessage.content }]
    }
  ];

  // Add system prompt
  const systemPrompt = {
    role: 'user',
    parts: [{ text: `You are a helpful AI programming assistant. The user has edited a message in our conversation. Please respond naturally to the edited content, maintaining context with the conversation history. Always use proper markdown formatting including:

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

  messages.unshift(systemPrompt);

  const body = {
    contents: messages,
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response to your edited message.';
}

// Get conversation context for edited messages
async function getConversationContext(chatId: string, parentId: string | null): Promise<any[]> {
  if (!parentId) {
    // If no parent, get all messages in the chat
    const messages = await db.select().from(message).where(eq(message.chatId, chatId)).orderBy(message.createdAt as any);
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
  }

  // Build context from parent chain
  const context: any[] = [];
  let currentParentId: string | null = parentId;
  const visited = new Set<string>();

  while (currentParentId && !visited.has(currentParentId)) {
    const parentMessage: any[] = await db.select().from(message).where(eq(message.id, currentParentId)).limit(1);
    if (parentMessage && parentMessage.length > 0) {
      const msg: any = parentMessage[0];
      context.unshift({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
      visited.add(currentParentId);
      currentParentId = msg.parentId || null;
    } else {
      break;
    }
  }

  return context;
}

// Fallback basic response generator for edited messages
function generateBasicResponse(content: string): string {
  const userQuery = content.toLowerCase().trim();
  
  if (userQuery.includes('edit') || userQuery.includes('change')) {
    return `# Message Edited Successfully ✏️

I see you've edited your message to: **"${content}"**

## What Happens Next
- Your **edited message** has been saved
- I've generated a **new response** based on your changes
- The conversation now has a **new branch** from this point

## Benefits of Editing
- **Refine your questions** for better answers
- **Correct typos** or clarify intent
- **Explore different approaches** to the same topic
- **Maintain conversation flow** while improving clarity

> **Ready to continue?** I'm here to help with your updated question!`;
  } else if (userQuery.includes('help') || userQuery.includes('assist')) {
    return `# I'm Here to Help! 🤝

You've edited your message to ask for help with: **"${content}"**

## How I Can Assist You
- **Code explanations** and examples
- **Debugging assistance** and problem-solving
- **Best practices** and coding standards
- **Algorithm design** and optimization
- **Language-specific guidance** and syntax help

## Getting the Best Help
- Be **specific** about your question
- Include **relevant code** when possible
- Mention the **programming language** you're using
- Describe what you've **already tried**

> **Let's work together** to solve your programming challenge!`;
  } else {
    return `# Response to Your Edited Message

You've updated your message to: **"${content}"**

## Understanding Your Request
I can see you're asking about: **${content}**

## My Response
I'm here to help you with this updated question. Since you've edited your message, I want to make sure I understand exactly what you need.

## Next Steps
- **Clarify** any specific details
- **Provide examples** if relevant
- **Break down** complex concepts
- **Offer solutions** and alternatives

> **What specific aspect** would you like me to focus on?`;
  }
}
