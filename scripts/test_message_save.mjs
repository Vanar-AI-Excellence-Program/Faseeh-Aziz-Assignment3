import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Using DATABASE_URL:', url);

const sql = postgres(url, { max: 1 });

async function testMessageSave() {
  try {
    console.log('🔍 Testing message save functionality...\n');
    
    // Check current state
    console.log('=== Current Database State ===');
    const [{ count: chatCount }] = await sql`select count(*)::int as count from "chat"`;
    console.log('Total chats:', chatCount);
    
    const [{ count: messageCount }] = await sql`select count(*)::int as count from "message"`;
    console.log('Total messages:', messageCount);
    
    const [{ count: branchCount }] = await sql`select count(*)::int as count from "branch"`;
    console.log('Total branches:', branchCount);
    
    // Get a sample chat
    const chats = await sql`select id, title from "chat" limit 1`;
    if (chats.length === 0) {
      console.log('❌ No chats found in database');
      return;
    }
    
    const chatId = chats[0].id;
    console.log(`\n📝 Testing with chat: ${chats[0].title} (ID: ${chatId})`);
    
    // Check if this chat has a branch
    const branches = await sql`select id, name, "isActive" from "branch" where "chatId" = ${chatId}`;
    console.log(`\n🌿 Branches for this chat:`, branches);
    
    let branchId = null;
    if (branches.length === 0) {
      console.log('⚠️ No branches found, creating one...');
      const [newBranch] = await sql`
        insert into "branch" ("id", "chatId", "name", "isActive", "createdAt", "updatedAt")
        values (gen_random_uuid()::text, ${chatId}, 'Test Branch', true, now(), now())
        returning id
      `;
      branchId = newBranch.id;
      console.log('✅ Created new branch:', branchId);
    } else {
      branchId = branches.find(b => b.isActive)?.id || branches[0].id;
      console.log('✅ Using existing branch:', branchId);
    }
    
    // Test inserting a user message
    console.log('\n👤 Testing user message insertion...');
    const [userMessage] = await sql`
      insert into "message" ("id", "chatId", "branchId", "role", "content", "createdAt")
      values (gen_random_uuid()::text, ${chatId}, ${branchId}, 'user', 'Test user message', now())
      returning id, content, role
    `;
    console.log('✅ User message saved:', userMessage);
    
    // Test inserting an assistant message
    console.log('\n🤖 Testing assistant message insertion...');
    const [assistantMessage] = await sql`
      insert into "message" ("id", "chatId", "branchId", "role", "content", "parentMessageId", "createdAt")
      values (gen_random_uuid()::text, ${chatId}, ${branchId}, 'assistant', 'Test assistant response', ${userMessage.id}, now())
      returning id, content, role, "parentMessageId"
    `;
    console.log('✅ Assistant message saved:', assistantMessage);
    
    // Verify messages were saved
    console.log('\n🔍 Verifying saved messages...');
    const savedMessages = await sql`
      select id, role, content, "parentMessageId", "branchId" 
      from "message" 
      where "chatId" = ${chatId} 
      order by "createdAt"
    `;
    console.log('📝 All messages in chat:');
    savedMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}... (Branch: ${msg.branchId})`);
    });
    
    // Test chunkCitations field
    console.log('\n📚 Testing chunkCitations field...');
    try {
      const [testMessage] = await sql`
        insert into "message" ("id", "chatId", "branchId", "role", "content", "chunkCitations", "createdAt")
        values (
          gen_random_uuid()::text, 
          ${chatId}, 
          ${branchId}, 
          'assistant', 
          'Test message with citations', 
          '{"chunks": [{"documentName": "test.pdf", "chunkId": 1, "content": "test content"}], "totalChunks": 1}'::jsonb,
          now()
        )
        returning id, "chunkCitations"
      `;
      console.log('✅ Message with chunkCitations saved:', testMessage);
    } catch (error) {
      console.log('❌ Failed to save message with chunkCitations:', error.message);
    }
    
    console.log('\n✅ Message save test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

testMessageSave();
