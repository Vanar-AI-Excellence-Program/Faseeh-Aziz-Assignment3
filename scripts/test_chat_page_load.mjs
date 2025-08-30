import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Using DATABASE_URL:', url);

const sql = postgres(url, { max: 1 });

async function testChatPageLoad() {
  try {
    console.log('🔍 Testing chat page load functionality...\n');
    
    // Simulate what the chat page load function does
    const userId = 'test-user-id'; // We'll use an existing user
    
    // Step 1: Get all chats for a user
    console.log('=== Step 1: Getting Chats ===');
    const chatsData = await sql`select * from "chat" order by "updatedAt" desc`;
    console.log(`Found ${chatsData.length} chats`);
    
    // Step 2: Fetch messages for all chats with proper branch handling
    console.log('\n=== Step 2: Fetching Messages with Branch Handling ===');
    const chatsWithMessages = [];
    
    for (const chatData of chatsData) {
      console.log(`\n📝 Processing chat: ${chatData.title}`);
      
      try {
        // Check if the branch table exists and has data
        let activeBranch = null;
        try {
          const [branchResult] = await sql`
            select * from "branch" 
            where "chatId" = ${chatData.id} and "isActive" = true 
            limit 1
          `;
          activeBranch = branchResult;
        } catch (branchError) {
          console.log(`   Branch table not available for chat ${chatData.id}, using fallback`);
        }
        
        let messagesData = [];
        if (activeBranch) {
          console.log(`   ✅ Active branch: ${activeBranch.name}`);
          
          // New schema - fetch messages by branch
          try {
            messagesData = await sql`
              select 
                id, role, content, "chatId", "branchId", "parentMessageId", "createdAt"
              from "message" 
              where "branchId" = ${activeBranch.id} 
              order by "createdAt"
            `;
            console.log(`   📨 Messages by branch: ${messagesData.length}`);
          } catch (messageError) {
            console.error(`   ❌ Error fetching messages by branch for chat ${chatData.id}:`, messageError.message);
            // Fallback to old schema
            messagesData = await sql`select * from "message" where "chatId" = ${chatData.id}`;
            console.log(`   📨 Messages by fallback: ${messagesData.length}`);
          }
        } else {
          console.log(`   ⚠️ No active branch found, using fallback`);
          
          // Fallback to old schema - fetch messages directly by chatId
          try {
            messagesData = await sql`select * from "message" where "chatId" = ${chatData.id}`;
            console.log(`   📨 Messages by fallback: ${messagesData.length}`);
          } catch (messageError) {
            console.error(`   ❌ Error fetching messages for chat ${chatData.id}:`, messageError.message);
            messagesData = [];
          }
        }
        
        const chatWithMessages = {
          ...chatData,
          messages: messagesData,
          activeBranch: activeBranch || null
        };
        
        chatsWithMessages.push(chatWithMessages);
        
        // Display message details
        if (messagesData.length > 0) {
          console.log(`   📝 Message details:`);
          messagesData.forEach((msg, index) => {
            console.log(`     ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
            console.log(`        Branch: ${msg.branchId || 'none'}, Parent: ${msg.parentMessageId || 'none'}`);
          });
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing chat ${chatData.id}:`, error.message);
        // Return chat without messages if there's an error
        chatsWithMessages.push({
          ...chatData,
          messages: [],
          activeBranch: null
        });
      }
    }
    
    // Step 3: Simulate the return data structure
    console.log('\n=== Step 3: Final Data Structure ===');
    const finalData = {
      user: { 
        id: 'test-user', 
        name: 'Test User', 
        email: 'test@example.com', 
        role: 'user' 
      },
      chats: chatsWithMessages,
      messages: [] // We don't need this anymore since messages are included with chats
    };
    
    console.log('✅ Final data structure:');
    console.log(`  - User: ${finalData.user.name} (${finalData.user.role})`);
    console.log(`  - Chats: ${finalData.chats.length}`);
    console.log(`  - Total messages: ${finalData.chats.reduce((sum, c) => sum + c.messages.length, 0)}`);
    
    // Step 4: Check for potential issues
    console.log('\n=== Step 4: Issue Detection ===');
    
    // Check for chats without branches
    const chatsWithoutBranches = chatsWithMessages.filter(c => !c.activeBranch);
    if (chatsWithoutBranches.length > 0) {
      console.log(`⚠️ Found ${chatsWithoutBranches.length} chats without branches:`);
      chatsWithoutBranches.forEach(chat => {
        console.log(`   - ${chat.title} (ID: ${chat.id})`);
      });
    } else {
      console.log('✅ All chats have active branches');
    }
    
    // Check for messages without branchId
    const messagesWithoutBranchId = chatsWithMessages
      .flatMap(c => c.messages)
      .filter(m => !m.branchId);
    
    if (messagesWithoutBranchId.length > 0) {
      console.log(`⚠️ Found ${messagesWithoutBranchId.length} messages without branchId:`);
      messagesWithoutBranchId.forEach(msg => {
        console.log(`   - [${msg.role}] ${msg.content.substring(0, 50)}...`);
      });
    } else {
      console.log('✅ All messages have proper branchId');
    }
    
    // Check for duplicate messages
    const allMessageIds = chatsWithMessages.flatMap(c => c.messages).map(m => m.id);
    const uniqueMessageIds = new Set(allMessageIds);
    
    if (allMessageIds.length !== uniqueMessageIds.size) {
      console.log(`⚠️ Found duplicate messages: ${allMessageIds.length} total, ${uniqueMessageIds.size} unique`);
    } else {
      console.log('✅ No duplicate messages found');
    }
    
    console.log('\n✅ Chat page load test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

testChatPageLoad();
