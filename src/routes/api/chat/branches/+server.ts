import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chatMessages, chatBranches, messageBranches } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Google Generative AI API integration
async function callGoogleGenerativeAI(messages: any[], file: File | null = null): Promise<string> {
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

// Helper function to generate basic response
function generateBasicResponse(messages: any[]): string {
    const lastMessage = messages[messages.length - 1];
    return `I received your message: "${lastMessage.content}". This is a basic response for the edited message.`;
}

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const session = await locals.auth();
        if (!session?.user?.id) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId, conversationId, newBranchMessages, originalBranchMessages, chatId, currentBranchId } = await request.json();
        
        if (!messageId || !conversationId || !newBranchMessages || !originalBranchMessages) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        const userId = session.user.id;

        // First, find the actual database message ID for the frontend message ID
        const dbMessage = await db.select()
            .from(chatMessages)
            .where(and(
                eq(chatMessages.originalMessageId, messageId),
                eq(chatMessages.conversationId, conversationId),
                eq(chatMessages.userId, userId)
            ))
            .limit(1);

        if (dbMessage.length === 0) {
            return json({ error: 'Message not found' }, { status: 404 });
        }

        const actualMessageId = dbMessage[0].id;

        // Count existing branches for this message
        const existingBranches = await db.select()
            .from(messageBranches)
            .where(eq(messageBranches.messageId, actualMessageId));

        const branchCount = existingBranches.length + 1;

        // Create new branch
        const newBranchId = `branch_${Date.now()}_${generateId()}`;
        const branchName = `Branch ${branchCount}`;
        const parentBranchId = currentBranchId || 'main';
        
        await db.insert(chatBranches).values({
            id: newBranchId,
            userId,
            conversationId,
            branchName,
            parentBranchId,
            createdAt: new Date(),
            isActive: true
        });

        // Save new branch messages - reuse existing messages when possible
        for (const message of newBranchMessages) {
            // Skip messages with missing required fields
            if (!message.role || !message.content) {
                console.log('Skipping message with missing required fields:', message);
                continue;
            }

            // Use frontend message ID if available, otherwise generate new one
            const messageId = message.id || generateId();
            
            // Create new message
            const dbMessageId = generateId();
            await db.insert(chatMessages).values({
                id: dbMessageId,
                userId,
                conversationId,
                parentMessageId: actualMessageId,
                originalMessageId: messageId,
                role: message.role,
                content: message.content,
                timestamp: new Date(),
                createdAt: new Date()
            });
            console.log('Created new message:', dbMessageId, 'for branch');

            // Check if this message is already assigned to this branch
            const existingBranchAssignment = await db.select()
                .from(messageBranches)
                .where(and(
                    eq(messageBranches.messageId, dbMessageId),
                    eq(messageBranches.branchId, newBranchId)
                ))
                .limit(1);

            if (existingBranchAssignment.length === 0) {
                // Assign message to the new branch
                await db.insert(messageBranches).values({
                    id: generateId(),
                    messageId: dbMessageId,
                    branchId: newBranchId,
                    conversationId,
                    userId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        // Generate AI response for the edited message
        let aiResponse = '';
        try {
            // Check if we have Google Generative AI API key
            if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
                console.log('Using Google Generative AI API for branch response');
                aiResponse = await callGoogleGenerativeAI(newBranchMessages);
            } else {
                console.log('No Google Generative AI API key found, using basic response for branch');
                aiResponse = generateBasicResponse(newBranchMessages);
            }
        } catch (error) {
            console.error('AI API error for branch:', error);
            aiResponse = generateBasicResponse(newBranchMessages);
        }

        // Save AI response to the new branch
        if (aiResponse.trim()) {
            const aiMessageId = generateId();
            const aiDbMessageId = generateId();
            
            // Get the last user message to set as parent for AI response
            const lastUserMessage = newBranchMessages[newBranchMessages.length - 1];
            const parentMessageId = lastUserMessage && lastUserMessage.id ? lastUserMessage.id : null;
            
            // Insert AI response message
            await db.insert(chatMessages).values({
                id: aiDbMessageId,
                userId: userId,
                conversationId: conversationId,
                parentMessageId: parentMessageId,
                originalMessageId: aiMessageId,
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
                createdAt: new Date()
            });

            // Assign AI response to the new branch
            await db.insert(messageBranches).values({
                id: generateId(),
                messageId: aiDbMessageId,
                branchId: newBranchId,
                conversationId: conversationId,
                userId: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('Saved AI response to new branch:', aiDbMessageId);
        }

        // Handle "Original" branch creation
        let originalBranchId = null;
        if (originalBranchMessages && originalBranchMessages.length > 0) {
            // Check if "Original" branch already exists for this message
            const existingOriginalBranches = await db.select()
                .from(chatBranches)
                .where(and(
                    eq(chatBranches.conversationId, conversationId),
                    eq(chatBranches.userId, userId),
                    eq(chatBranches.branchName, 'Original'),
                    eq(chatBranches.isActive, true)
                ));

            let foundOriginalBranch = null;
            for (const branch of existingOriginalBranches) {
                // Get messages for this branch using the join table
                const branchMessageRelations = await db
                    .select({
                        message: chatMessages,
                        branchId: messageBranches.branchId
                    })
                    .from(chatMessages)
                    .innerJoin(messageBranches, eq(chatMessages.id, messageBranches.messageId))
                    .where(and(
                        eq(messageBranches.branchId, branch.id),
                        eq(chatMessages.conversationId, conversationId),
                        eq(chatMessages.userId, userId)
                    ));
                
                const hasMessage = branchMessageRelations.some(({ message }) => 
                    message.originalMessageId === messageId || message.parentMessageId === actualMessageId
                );
                
                if (hasMessage) {
                    foundOriginalBranch = branch;
                    break;
                }
            }

            if (!foundOriginalBranch) {
                // Create new "Original" branch
                originalBranchId = `original_${messageId}_${generateId()}`;
                await db.insert(chatBranches).values({
                    id: originalBranchId,
                    userId,
                    conversationId,
                    branchName: 'Original',
                    parentBranchId: 'main',
                    createdAt: new Date(),
                    isActive: true
                });

                // Save original branch messages - reuse existing messages when possible
                for (const message of originalBranchMessages) {
                    // Check if this message already exists in the database
                    const existingMessage = await db.select()
                        .from(chatMessages)
                        .where(and(
                            eq(chatMessages.originalMessageId, message.id),
                            eq(chatMessages.conversationId, conversationId),
                            eq(chatMessages.userId, userId)
                        ))
                        .limit(1);

                    let dbMessageId;
                    
                    if (existingMessage.length > 0) {
                        // Reuse existing message
                        dbMessageId = existingMessage[0].id;
                        console.log('Reusing existing message for original branch:', dbMessageId, 'for original:', message.id);
                    } else {
                        // Create new message for original branch
                        dbMessageId = generateId();
                        await db.insert(chatMessages).values({
                            id: dbMessageId,
                            userId,
                            conversationId,
                            parentMessageId: actualMessageId,
                            originalMessageId: message.id,
                            role: message.role,
                            content: message.content,
                            timestamp: new Date(),
                            createdAt: new Date()
                        });
                        console.log('Created new message for original branch:', dbMessageId, 'for original:', message.id);
                    }

                    // Check if this message is already assigned to this branch
                    const existingBranchAssignment = await db.select()
                        .from(messageBranches)
                        .where(and(
                            eq(messageBranches.messageId, dbMessageId),
                            eq(messageBranches.branchId, originalBranchId)
                        ))
                        .limit(1);

                    if (existingBranchAssignment.length === 0) {
                        // Assign message to the original branch
                        await db.insert(messageBranches).values({
                            id: generateId(),
                            messageId: dbMessageId,
                            branchId: originalBranchId,
                            conversationId,
                            userId,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                }
            } else {
                originalBranchId = foundOriginalBranch.id;
            }
        }

        return json({ 
            success: true, 
            newBranchId, 
            branchCount,
            messageId: messageId,
            originalBranchId,
            aiResponse: aiResponse.trim() // Return the AI response for frontend
        });

    } catch (error) {
        console.error('Error creating branch:', error);
        return json({ error: 'Failed to create branch' }, { status: 500 });
    }
};

export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        const session = await locals.auth();
        if (!session?.user?.id) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const conversationId = url.searchParams.get('conversationId');
        const messageId = url.searchParams.get('messageId');
        
        if (!conversationId) {
            return json({ error: 'Conversation ID is required' }, { status: 400 });
        }

        const userId = session.user.id;

        // Get all branches for this conversation
        const branches = await db.select()
            .from(chatBranches)
            .where(and(
                eq(chatBranches.conversationId, conversationId),
                eq(chatBranches.userId, userId),
                eq(chatBranches.isActive, true)
            ));

        // Get message branches for this conversation
        const messageBranchesData = await db.select()
            .from(messageBranches)
            .innerJoin(chatMessages, eq(messageBranches.messageId, chatMessages.id))
            .where(and(
                eq(chatMessages.conversationId, conversationId),
                eq(messageBranches.userId, userId)
            ));

        // Get messages for each branch using the join table
        const branchMessages = await Promise.all(
            branches.map(async (branch) => {
                const messagesWithBranches = await db
                    .select({
                        message: chatMessages,
                        branchId: messageBranches.branchId
                    })
                    .from(chatMessages)
                    .innerJoin(messageBranches, eq(chatMessages.id, messageBranches.messageId))
                    .where(and(
                        eq(messageBranches.branchId, branch.id),
                        eq(chatMessages.conversationId, conversationId),
                        eq(chatMessages.userId, userId)
                    ));

                return {
                    branchId: branch.id,
                    branchName: branch.branchName,
                    messages: messagesWithBranches.map(({ message }) => ({
                        id: message.originalMessageId || message.id.toString(),
                        role: message.role,
                        content: message.content,
                        timestamp: message.timestamp,
                        createdAt: message.createdAt,
                        parentMessageId: message.parentMessageId
                    }))
                };
            })
        );

        // If messageId is provided, filter branches to only those related to this message
        let filteredBranches = branches;
        if (messageId) {
            console.log('Filtering branches for message:', messageId);
            
            // Find the actual database message ID for the frontend message ID
            const dbMessage = await db.select()
                .from(chatMessages)
                .where(and(
                    eq(chatMessages.originalMessageId, messageId),
                    eq(chatMessages.conversationId, conversationId),
                    eq(chatMessages.userId, userId)
                ))
                .limit(1);

            if (dbMessage.length > 0) {
                const actualMessageId = dbMessage[0].id;
                
                // Filter branches to only those that contain this message or were created from it
                const branchFilters = await Promise.all(branches.map(async (branch) => {
                    const branchMessageRelations = await db
                        .select({
                            message: chatMessages,
                            branchId: messageBranches.branchId
                        })
                        .from(chatMessages)
                        .innerJoin(messageBranches, eq(chatMessages.id, messageBranches.messageId))
                        .where(and(
                            eq(messageBranches.branchId, branch.id),
                            eq(chatMessages.conversationId, conversationId),
                            eq(chatMessages.userId, userId)
                        ));
                    
                    // Check if this branch contains the specific message
                    const hasMessage = branchMessageRelations.some(({ message }) => 
                        message.originalMessageId === messageId || message.parentMessageId === actualMessageId
                    );
                    
                    // For "Original" branch, include if it has the message
                    if (branch.branchName === 'Original' && hasMessage) {
                        return { branch, include: true };
                    }
                    
                    // For other branches, only include if they were created for this message
                    const wasCreatedForThisMessage = branchMessageRelations.some(({ message }) => 
                        message.parentMessageId === actualMessageId
                    );
                    
                    return { branch, include: hasMessage && wasCreatedForThisMessage };
                }));
                
                filteredBranches = branchFilters
                    .filter(result => result.include)
                    .map(result => result.branch);
            }
        }

        return json({
            success: true,
            branches: filteredBranches.map(branch => ({
                id: branch.id,
                name: branch.branchName,
                messageCount: branchMessages.find(bm => bm.branchId === branch.id)?.messages.length || 0,
                parentBranchId: branch.parentBranchId
            })),
            branchMessages,
            messageBranches: messageBranchesData.map(mb => ({
                messageId: mb.message_branches.messageId,
                branchCount: 0 // branchCount column was removed
            }))
        });

    } catch (error) {
        console.error('Error loading branches:', error);
        return json({ error: 'Failed to load branches' }, { status: 500 });
    }
};
