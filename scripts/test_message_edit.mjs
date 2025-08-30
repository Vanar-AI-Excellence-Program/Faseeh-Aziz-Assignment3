import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function testMessageEdit() {
  try {
    console.log('🧪 Testing message editing functionality...\n');
    
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...');
    try {
      await db.execute('SELECT 1');
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }
    
    // Test 2: Check message table structure
    console.log('\n2️⃣ Checking message table structure...');
    try {
      const tableInfo = await db.execute(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'message' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Message table columns:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } catch (error) {
      console.error('❌ Failed to get table structure:', error);
    }
    
    // Test 3: Check if there are any messages
    console.log('\n3️⃣ Checking for existing messages...');
    try {
      const messageCount = await db.execute('SELECT COUNT(*) as count FROM message');
      console.log(`📝 Total messages in database: ${messageCount[0]?.count || 0}`);
      
      if ((messageCount[0]?.count || 0) > 0) {
        const sampleMessages = await db.execute('SELECT id, role, content, "chatId" FROM message LIMIT 3');
        console.log('📋 Sample messages:');
        sampleMessages.forEach((msg, index) => {
          console.log(`  ${index + 1}. ID: ${msg.id}, Role: ${msg.role}, Chat: ${msg.chatId}`);
          console.log(`     Content: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to check messages:', error);
    }
    
    // Test 4: Check chat table
    console.log('\n4️⃣ Checking chat table...');
    try {
      const chatCount = await db.execute('SELECT COUNT(*) as count FROM chat');
      console.log(`💬 Total chats in database: ${chatCount[0]?.count || 0}`);
      
      if ((chatCount[0]?.count || 0) > 0) {
        const sampleChats = await db.execute('SELECT id, title, "userId" FROM chat LIMIT 3');
        console.log('📋 Sample chats:');
        sampleChats.forEach((chat, index) => {
          console.log(`  ${index + 1}. ID: ${chat.id}, Title: ${chat.title}, User: ${chat.userId}`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to check chats:', error);
    }
    
    // Test 5: Test a simple message update (if messages exist)
    console.log('\n5️⃣ Testing message update...');
    try {
      const messages = await db.execute('SELECT id, content FROM message LIMIT 1');
      if (messages.length > 0) {
        const testMessage = messages[0];
        const originalContent = testMessage.content;
        const newContent = originalContent + ' [TEST EDITED]';
        
        console.log(`🔄 Testing update on message: ${testMessage.id}`);
        console.log(`   Original: ${originalContent.substring(0, 50)}...`);
        console.log(`   New: ${newContent.substring(0, 50)}...`);
        
        const updateResult = await db.execute(`
          UPDATE message 
          SET content = $1 
          WHERE id = $2 
          RETURNING id, content
        `, [newContent, testMessage.id]);
        
        if (updateResult.length > 0) {
          console.log('✅ Message update successful!');
          
          // Revert the change
          await db.execute(`
            UPDATE message 
            SET content = $1 
            WHERE id = $2
          `, [originalContent, testMessage.id]);
          console.log('🔄 Reverted test change');
        } else {
          console.log('❌ Message update failed');
        }
      } else {
        console.log('⚠️ No messages found to test update');
      }
    } catch (error) {
      console.error('❌ Failed to test message update:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
  }
}

testMessageEdit();
