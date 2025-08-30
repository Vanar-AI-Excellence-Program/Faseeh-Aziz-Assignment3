import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message, conversationDocuments, chat } from '$lib/server/db/schema';
import { generateText } from '$lib/ai';
import { env } from '$env/dynamic/private';
import { findSimilarChunks, checkVectorExtension } from '$lib/server/db/vector-utils';
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';

// Generate embeddings using Google Gemini
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
    throw error;
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if vector extension is available
    const vectorExtensionAvailable = await checkVectorExtension();
    if (!vectorExtensionAvailable) {
      return json({ 
        error: 'Vector extension not available',
        details: 'Please ensure pgvector extension is installed in your database'
      }, { status: 500 });
    }

    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Messages are required' }, { status: 400 });
    }

    // Get the last user message for RAG retrieval
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return json({ error: 'No user message found' }, { status: 400 });
    }

    console.log('🔍 Starting RAG-enhanced chat for message:', lastUserMessage.content.substring(0, 100) + '...');

    // Step 1: Generate embedding for the user query
    console.log('🔢 Generating embedding for user query...');
    let queryEmbedding;
    
    try {
      queryEmbedding = await generateEmbedding(lastUserMessage.content);
      if (queryEmbedding && queryEmbedding.embedding && queryEmbedding.embedding.length > 0) {
        console.log('✅ Query embedding generated, dimensions:', queryEmbedding.embedding.length);
      } else {
        throw new Error('Invalid embedding response');
      }
    } catch (embeddingError) {
      console.error('❌ Embedding generation failed:', embeddingError);
      return json({ 
        error: 'Failed to generate embedding for query',
        details: 'Please check your Google Gemini API configuration'
      }, { status: 500 });
    }

    // Step 2: Find similar chunks using vector similarity
    console.log('🔍 Searching for similar chunks...');
    const similarChunks = await findSimilarChunks(queryEmbedding.embedding, 5);
    console.log(`✅ Found ${similarChunks.length} similar chunks`);
    
    // Filter out chunks with very high distance (low similarity)
    const relevantChunks = similarChunks.filter(chunk => chunk.distance < 0.8);
    console.log(`✅ Filtered to ${relevantChunks.length} relevant chunks (distance < 0.8)`);

    // Step 3: Build context from retrieved chunks
    let context = '';
    let citations: Array<{ documentName: string; chunkId: number; content: string; distance: number; documentId: number }> = [];
    
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
    }

    // Step 4: Build the full prompt with context
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

    console.log('📝 Generating AI response with context...');
    console.log('Context length:', context.length);
    console.log('Citations found:', citations.length);

    // Step 5: Generate AI response
    let result;
    try {
      result = await generateText({
        prompt: finalPrompt,
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7
      });
      console.log('✅ AI response generated');
    } catch (aiError: any) {
      console.error('❌ AI text generation failed:', aiError);
      
      // Fallback: try to use a simpler prompt without context
      console.log('🔄 Trying fallback with simpler prompt...');
      try {
        const fallbackPrompt = `You are a helpful AI assistant. Please respond to the following conversation:\n\n${conversation}`;
        result = await generateText({
          prompt: fallbackPrompt,
          model: 'gpt-3.5-turbo',
          maxTokens: 1000,
          temperature: 0.7
        });
        console.log('✅ Fallback AI response generated');
      } catch (fallbackError: any) {
        console.error('❌ Fallback AI generation also failed:', fallbackError);
        throw new Error('AI text generation failed completely');
      }
    }

    // Step 6: Save messages to database if chatId is provided
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
          // Continue without saving to database
        } else {
          console.log('✅ Chat exists, proceeding with message save');
          
          // Find the user message that needs to be saved (the one without an ID or with a temporary ID)
          const userMessages = messages.filter(m => m.role === 'user');
          let savedUserMessage = null;
          
          for (const msg of userMessages) {
            // Check if this message already exists in database by looking for a UUID pattern
            const isTemporaryId = !msg.id || msg.id.length < 20; // Temporary IDs are usually shorter
            
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
              
              // Store the ID for the next message to reference
              msg.id = savedMsg.id;
              console.log('✅ User message saved with ID:', savedMsg.id);
            } else {
              console.log('ℹ️ User message already has ID, skipping save:', msg.id);
              savedUserMessage = msg; // Use existing message
            }
          }
          
          // Save the AI response with parentId pointing to the last user message
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
              content: result.text,
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

    // Step 7: Return response with citations and saved message IDs
    return json({
      reply: { content: result.text },
      context: {
        used: relevantChunks.length > 0,
        chunks: citations,
        totalChunks: relevantChunks.length,
        searchQuery: lastUserMessage.content
      },
      savedMessages: savedMessages, // Return the saved messages with their IDs
      metadata: {
        queryEmbeddingDimensions: queryEmbedding.embedding.length,
        processingTime: Date.now(),
        ragEnabled: true,
        vectorExtensionAvailable: true,
        messagesSaved: savedMessages.length,
        conversationDocumentsLinked: savedConversationDocuments.length,
        chunkCitationsStored: citations.length > 0
      }
    });

  } catch (error: any) {
    console.error('❌ RAG chat error:', error);
    return json({ 
      error: 'Chat failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
};
