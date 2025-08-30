import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Using DATABASE_URL:', url);

const sql = postgres(url, { max: 1 });

async function testFullChatFlow() {
  try {
    console.log('🔍 Testing full chat flow...\n');
    
    // Step 1: Check current database state
    console.log('=== Step 1: Current Database State ===');
    const [{ count: chatCount }] = await sql`select count(*)::int as count from "chat"`;
    console.log('Total chats:', chatCount);
    
    const [{ count: messageCount }] = await sql`select count(*)::int as count from "message"`;
    console.log('Total messages:', messageCount);
    
    const [{ count: branchCount }] = await sql`select count(*)::int as count from "branch"`;
    console.log('Total branches:', branchCount);
    
    // Step 2: Simulate chat page load (what the server does)
    console.log('\n=== Step 2: Simulating Chat Page Load ===');
    const chatsData = await sql`select * from "chat" order by "updatedAt" desc`;
    
    const chatsWithMessages = [];
    for (const chatData of chatsData) {
      console.log(`\n📝 Processing chat: ${chatData.title}`);
      
      // Get active branch
      const [activeBranch] = await sql`select * from "branch" where "chatId" = ${chatData.id} and "isActive" = true limit 1`;
      
      if (activeBranch) {
        console.log(`✅ Active branch: ${activeBranch.name}`);
        
        // Get messages for this branch
        const messagesData = await sql`
          select id, role, content, "branchId", "parentMessageId", "createdAt"
          from "message" 
          where "branchId" = ${activeBranch.id} 
          order by "createdAt"
        `;
        
        console.log(`📨 Messages in branch: ${messagesData.length}`);
        
        const chatWithMessages = {
          ...chatData,
          messages: messagesData,
          activeBranch: activeBranch
        };
        
        chatsWithMessages.push(chatWithMessages);
      } else {
        console.log('❌ No active branch found');
        chatsWithMessages.push({
          ...chatData,
          messages: [],
          activeBranch: null
        });
      }
    }
    
    // Step 3: Simulate frontend data processing
    console.log('\n=== Step 3: Simulating Frontend Data Processing ===');
    const processedChats = chatsWithMessages.map((chat) => ({
      id: chat.id,
      title: chat.title,
      createdAt: new Date(chat.createdAt),
      messages: chat.messages ? chat.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        branchId: msg.branchId,
        parentMessageId: msg.parentMessageId
      })) : [],
      branches: [chat.activeBranch].filter(Boolean),
      activeBranch: chat.activeBranch,
      totalBranches: chat.activeBranch ? 1 : 0
    }));
    
    console.log('✅ Processed chats:', processedChats.length);
    processedChats.forEach((chat, index) => {
      console.log(`  Chat ${index + 1}: ${chat.title} - ${chat.messages.length} messages`);
    });
    
    // Step 4: Simulate message sending
    console.log('\n=== Step 4: Simulating Message Sending ===');
    if (processedChats.length > 0) {
      const testChat = processedChats[0];
      console.log(`📝 Testing with chat: ${testChat.title}`);
      
      // Simulate user message
      const testUserMessage = {
        id: 'test-user-' + Date.now(),
        role: 'user',
        content: 'Test message from script',
        chatId: testChat.id,
        parentMessageId: null
      };
      
      console.log('👤 Test user message:', testUserMessage.content);
      
      // Simulate RAG API call (this would normally go to the actual API)
      console.log('🤖 Simulating RAG API response...');
      const mockResponse = {
        reply: { content: 'This is a test response from the RAG API' },
        context: { used: false, chunks: [], totalChunks: 0 },
        metadata: { messagesSaved: 0, ragEnabled: true }
      };
      
      console.log('📡 Mock API response:', mockResponse);
      
      // Step 5: Check if messages would be saved
      console.log('\n=== Step 5: Checking Message Save Logic ===');
      if (mockResponse.metadata.messagesSaved > 0) {
        console.log('✅ Messages would be saved by API, frontend should refresh');
      } else {
        console.log('⚠️ Messages not saved by API, frontend should add to local state');
      }
    }
    
    // Step 6: Check for potential issues
    console.log('\n=== Step 6: Checking for Potential Issues ===');
    
    // Check for duplicate messages
    for (const chat of chatsWithMessages) {
      if (chat.messages && chat.messages.length > 0) {
        const messageIds = chat.messages.map(m => m.id);
        const uniqueIds = new Set(messageIds);
        
        if (messageIds.length !== uniqueIds.size) {
          console.log(`⚠️ WARNING: Chat "${chat.title}" has duplicate messages!`);
          console.log(`   Total: ${messageIds.length}, Unique: ${uniqueIds.size}`);
        }
      }
    }
    
    // Check for orphaned messages
    const orphanedMessages = await sql`
      select m.id, m.content, m."chatId"
      from "message" m
      left join "chat" c on m."chatId" = c.id
      where c.id is null
    `;
    
    if (orphanedMessages.length > 0) {
      console.log(`⚠️ WARNING: Found ${orphanedMessages.length} orphaned messages!`);
    } else {
      console.log('✅ No orphaned messages found');
    }
    
    // Check for messages without branches
    const messagesWithoutBranches = await sql`
      select count(*)::int as count
      from "message" 
      where "branchId" is null
    `;
    
    if (messagesWithoutBranches[0].count > 0) {
      console.log(`⚠️ WARNING: Found ${messagesWithoutBranches[0].count} messages without branchId!`);
    } else {
      console.log('✅ All messages have proper branchId');
    }
    
    console.log('\n✅ Full chat flow test completed!');
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  - Total chats: ${chatCount}`);
    console.log(`  - Total messages: ${messageCount}`);
    console.log(`  - Total branches: ${branchCount}`);
    console.log(`  - Chats with messages: ${chatsWithMessages.filter(c => c.messages.length > 0).length}`);
    console.log(`  - Total messages displayed: ${chatsWithMessages.reduce((sum, c) => sum + c.messages.length, 0)}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

testFullChatFlow();
