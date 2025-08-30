import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Using DATABASE_URL:', url);

const sql = postgres(url, { max: 1 });

async function debugChatLoading() {
  try {
    console.log('🔍 Debugging chat loading functionality...\n');
    
    // Simulate what the chat page load function does
    const userId = 'test-user-id'; // We'll use an existing user
    
    // Get all chats for a user
    const chatsData = await sql`select * from "chat" order by "updatedAt" desc`;
    console.log('📝 Found chats:', chatsData.length);
    
    for (const chatData of chatsData) {
      console.log(`\n--- Chat: ${chatData.title} (ID: ${chatData.id}) ---`);
      
      // Check for branches
      const branches = await sql`select * from "branch" where "chatId" = ${chatData.id}`;
      console.log(`🌿 Branches: ${branches.length}`);
      
      if (branches.length > 0) {
        const activeBranch = branches.find(b => b.isActive) || branches[0];
        console.log(`✅ Active branch: ${activeBranch.name} (ID: ${activeBranch.id})`);
        
        // Fetch messages by branch
        const messagesData = await sql`
          select id, role, content, "branchId", "parentMessageId", "createdAt"
          from "message" 
          where "branchId" = ${activeBranch.id} 
          order by "createdAt"
        `;
        
        console.log(`📨 Messages in branch: ${messagesData.length}`);
        messagesData.forEach((msg, index) => {
          console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
          console.log(`     Branch: ${msg.branchId}, Parent: ${msg.parentMessageId || 'none'}`);
        });
        
        // Check for duplicate messages
        const messageIds = messagesData.map(m => m.id);
        const uniqueIds = new Set(messageIds);
        if (messageIds.length !== uniqueIds.size) {
          console.log(`⚠️ WARNING: Duplicate messages detected!`);
          console.log(`   Total: ${messageIds.length}, Unique: ${uniqueIds.size}`);
        }
        
      } else {
        console.log('❌ No branches found for this chat');
        
        // Fallback: fetch messages directly by chatId
        const messagesData = await sql`
          select id, role, content, "branchId", "parentMessageId", "createdAt"
          from "message" 
          where "chatId" = ${chatData.id} 
          order by "createdAt"
        `;
        
        console.log(`📨 Messages (fallback): ${messagesData.length}`);
        messagesData.forEach((msg, index) => {
          console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
        });
      }
    }
    
    console.log('\n✅ Chat loading debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

debugChatLoading();
