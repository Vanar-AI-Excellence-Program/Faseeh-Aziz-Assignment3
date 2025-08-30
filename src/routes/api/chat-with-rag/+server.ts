import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message, conversationDocuments, chat } from '$lib/server/db/schema';
import { generateText, streamTextGeneration } from '$lib/ai';
import { env } from '$env/dynamic/private';
import { findSimilarChunks, checkVectorExtension } from '$lib/server/db/vector-utils';
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';

// Generate embeddings using Google Gemini (same as ingest API)
async function generateEmbedding(text: string): Promise<{ embedding: number[] }> {
  try {
    if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('No Google Gemini API key configured');
    }

    // Import Google Generative AI package
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const genAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding;
    
    return { embedding: embedding.values };
  } catch (error: any) {
    console.error('❌ Embedding generation failed:', error);
    
    // Fallback: create a simple hash-based embedding (same as ingest API)
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    
    // Create a 768-dimensional vector (like Google Gemini embeddings)
    const fallbackEmbedding = new Array(768).fill(0);
    for (let i = 0; i < 768; i++) {
      fallbackEmbedding[i] = Math.sin(hash + i) * 0.1; // Simple pseudo-random values
    }
    
    console.log('⚠️ Using fallback hash-based embedding');
    return { embedding: fallbackEmbedding };
  }
}

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

    const { messages, useRAG = true } = await request.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Messages are required' }, { status: 400 });
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return json({ error: 'No user message found' }, { status: 400 });
    }

    console.log('🔍 Starting chat with RAG option:', useRAG ? 'enabled' : 'disabled');

    let context = '';
    let citations: Array<{ documentName: string; chunkId: number; content: string; distance: number; documentId: number }> = [];
    let ragUsed = false;

    // Step 1: Try RAG if enabled and vector extension is available
    if (useRAG) {
      try {
        const vectorExtensionAvailable = await checkVectorExtension();
        if (vectorExtensionAvailable) {
          console.log('🔢 Generating embedding for user query...');
          const queryEmbedding = await generateEmbedding(lastUserMessage.content);
          
          if (queryEmbedding && queryEmbedding.embedding && queryEmbedding.embedding.length > 0) {
            console.log('✅ Query embedding generated, dimensions:', queryEmbedding.embedding.length);
            
            // Step 2: Find similar chunks using vector similarity
            console.log('🔍 Searching for similar chunks...');
            const similarChunks = await findSimilarChunks(queryEmbedding.embedding, 5);
            console.log(`✅ Found ${similarChunks.length} similar chunks`);
            
            // Filter out chunks with very high distance (low similarity) - using a very lenient threshold
            const relevantChunks = similarChunks.filter(chunk => chunk.distance < 2.0);
            console.log(`✅ Filtered to ${relevantChunks.length} relevant chunks (distance < 2.0)`);
            console.log('🔍 All chunks with distances:', similarChunks.map(chunk => ({ 
              documentName: chunk.documentName, 
              distance: chunk.distance,
              content: chunk.content.substring(0, 50) + '...'
            })));
            console.log('🔍 Relevant chunks:', relevantChunks.map(chunk => ({ 
              documentName: chunk.documentName, 
              distance: chunk.distance,
              content: chunk.content.substring(0, 50) + '...'
            })));

            if (relevantChunks.length > 0) {
              context = 'Use the following context when answering:\n\n';
              
              relevantChunks.forEach((chunk, index) => {
                const chunkContent = chunk.content as string;
                context += `Context ${index + 1} (from "${chunk.documentName}"):\n${chunkContent}\n\n`;
                citations.push({
                  documentName: chunk.documentName,
                  chunkId: chunk.chunkId,
                  content: chunkContent.substring(0, 150) + '...',
                  distance: chunk.distance,
                  documentId: chunk.documentId
                });
              });
              
              context += 'Please use this context to provide accurate and relevant information. ';
              context += 'If the context doesn\'t contain relevant information for the question, say so. ';
              context += 'Always cite which context you\'re using when answering.\n\n';
              
              ragUsed = true;
              console.log('✅ RAG context built successfully');
            } else {
              console.log('⚠️ No relevant chunks found, proceeding without RAG');
            }
          } else {
            console.log('⚠️ Invalid embedding response, proceeding without RAG');
          }
        } else {
          console.log('⚠️ Vector extension not available, proceeding without RAG');
        }
      } catch (ragError) {
        console.error('❌ RAG processing failed:', ragError);
        console.log('🔄 Falling back to regular chat');
      }
    }

    // Step 3: Build the full prompt with context (if any)
    const conversation = messages.map(msg => 
      `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`
    ).join('\n\n');

    let systemPrompt = 'You are a helpful AI assistant';
    if (context) {
      systemPrompt += ` with access to a knowledge base. ${context}Always respond using proper markdown formatting and cite your sources when using provided context.`;
    } else {
      systemPrompt += '. Please respond using proper markdown formatting.';
    }
    const finalPrompt = `${systemPrompt}\n\n${conversation}`;

    console.log('📝 Generating AI response...');
    console.log('Context length:', context.length);
    console.log('Citations found:', citations.length);

    // Step 4: Generate AI response
    let aiResponse = '';
    try {
      const result = await generateText({
        prompt: finalPrompt,
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7
      });
      aiResponse = result.text;
      console.log('✅ AI response generated');
    } catch (aiError: any) {
      console.error('❌ AI text generation failed:', aiError);
      
      // Fallback: try to use a simpler prompt without context
      console.log('🔄 Trying fallback with simpler prompt...');
      try {
        const fallbackPrompt = `You are a helpful AI assistant. Please respond to the following conversation:\n\n${conversation}`;
        const result = await generateText({
          prompt: fallbackPrompt,
          model: 'gpt-3.5-turbo',
          maxTokens: 1000,
          temperature: 0.7
        });
        aiResponse = result.text;
        console.log('✅ Fallback AI response generated');
      } catch (fallbackError: any) {
        console.error('❌ Fallback AI generation also failed:', fallbackError);
        throw new Error('AI text generation failed completely');
      }
    }

    // Step 5: Save messages to database if chatId is provided
    let savedMessages = [];
    let savedConversationDocuments = [];
    
    // Find chatId from any message in the array
    const chatId = messages.find(msg => msg.chatId)?.chatId;
    
    if (chatId) {
      try {
        console.log('💾 Found chatId:', chatId, 'proceeding with database save');
        
        // First, verify the chat exists
        const chatExists = await db.select().from(chat).where(eq(chat.id, chatId)).limit(1);
        if (chatExists.length === 0) {
          console.log('⚠️ Chat does not exist, skipping database save');
        } else {
          console.log('✅ Chat exists, proceeding with message save');
          
          // Find the user message that needs to be saved
          const userMessages = messages.filter(m => m.role === 'user');
          let savedUserMessage = null;
          
          for (const msg of userMessages) {
            // Check if this message already exists in database
            const isTemporaryId = !msg.id || msg.id.length < 20;
            
            if (isTemporaryId) {
              console.log('💾 Saving user message to database:', msg.content.substring(0, 50) + '...');
              
              const [savedMsg] = await db.insert(message).values({
                id: randomUUID(),
                chatId: chatId,
                parentId: msg.parentId || null,
                role: msg.role,
                content: msg.content,
                createdAt: new Date()
              }).returning();
              
              savedUserMessage = savedMsg;
              savedMessages.push(savedUserMessage);
              msg.id = savedMsg.id;
              console.log('✅ User message saved with ID:', savedMsg.id);
            } else {
              console.log('ℹ️ User message already has ID, skipping save:', msg.id);
              savedUserMessage = msg;
            }
          }
          
          // Save the AI response
          const parentId = savedUserMessage?.id || null;
          
          if (parentId) {
            console.log('💾 Saving AI response to database...');
            
            // Prepare chunk citations for storage
            const chunkCitationsData = citations.length > 0 ? {
              chunks: citations.map(c => ({
                documentName: c.documentName,
                chunkId: c.chunkId,
                content: c.content,
                distance: c.distance
              })),
              totalChunks: citations.length,
              searchQuery: lastUserMessage.content
            } : null;
            
            const [savedAIMessage] = await db.insert(message).values({
              id: randomUUID(),
              chatId: chatId,
              parentId: parentId,
              role: 'assistant',
              content: aiResponse,
              chunkCitations: chunkCitationsData,
              createdAt: new Date()
            }).returning();
            
            savedMessages.push(savedAIMessage);
            console.log('✅ AI response saved with ID:', savedAIMessage.id);
            
            // Link documents to conversation if citations exist
            if (citations.length > 0) {
              const uniqueDocumentIds = [...new Set(citations.map(c => c.documentId))];
              
              for (const documentId of uniqueDocumentIds) {
                // Check if this document is already linked to this conversation
                const existingLink = await db.select().from(conversationDocuments)
                  .where(and(eq(conversationDocuments.conversationId, chatId), eq(conversationDocuments.documentId, documentId)))
                  .limit(1);
                
                if (existingLink.length === 0) {
                  // Create new link
                  const [newLink] = await db.insert(conversationDocuments).values({
                    id: randomUUID(),
                    conversationId: chatId,
                    documentId: documentId,
                    uploadedAt: new Date(),
                    metadata: {
                      linkedViaRAG: true,
                      firstCitedAt: new Date().toISOString(),
                      citationCount: citations.filter(c => c.documentId === documentId).length
                    }
                  }).returning();
                  savedConversationDocuments.push(newLink);
                } else {
                  // Update existing link metadata
                  const currentMetadata = existingLink[0].metadata as any || {};
                  await db.update(conversationDocuments)
                    .set({ 
                      metadata: {
                        ...currentMetadata,
                        lastCitedAt: new Date().toISOString(),
                        citationCount: (currentMetadata.citationCount || 0) + 
                                      citations.filter(c => c.documentId === documentId).length
                      }
                    })
                    .where(eq(conversationDocuments.id, existingLink[0].id));
                }
              }
            }
            
            console.log('✅ Messages saved to database:', savedMessages.length);
            console.log('🔗 AI response parentId:', parentId);
            console.log('📚 Chunk citations stored:', chunkCitationsData ? 'Yes' : 'No');
            console.log('📄 Conversation documents linked:', savedConversationDocuments.length);
          } else {
            console.log('⚠️ No valid user message found to use as parent');
          }
        }
      } catch (dbError) {
        console.error('❌ Failed to save messages to database:', dbError);
        // Continue even if saving fails
      }
    } else {
      console.log('⚠️ No chatId found in messages, skipping database save');
    }

    // Step 6: Create a streaming response
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

  } catch (error: any) {
    console.error('❌ Chat with RAG error:', error);
    return json({ 
      error: 'Chat failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
};
