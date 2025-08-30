import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Using DATABASE_URL:', url);

const sql = postgres(url, { max: 1 });

async function fixExistingChats() {
  try {
    console.log('🔧 Fixing existing chats by adding default branches...\n');
    
    // Step 1: Check current state
    console.log('=== Current State ===');
    const [{ count: chatCount }] = await sql`select count(*)::int as count from "chat"`;
    console.log('Total chats:', chatCount);
    
    const [{ count: branchCount }] = await sql`select count(*)::int as count from "branch"`;
    console.log('Total branches:', branchCount);
    
    // Step 2: Find chats without branches
    console.log('\n=== Finding Chats Without Branches ===');
    const chatsWithoutBranches = await sql`
      select c.id, c.title, c."createdAt"
      from "chat" c
      left join "branch" b on c.id = b."chatId"
      where b.id is null
      order by c."createdAt"
    `;
    
    console.log(`Found ${chatsWithoutBranches.length} chats without branches:`);
    chatsWithoutBranches.forEach((chat, index) => {
      console.log(`  ${index + 1}. ${chat.title} (ID: ${chat.id})`);
    });
    
    if (chatsWithoutBranches.length === 0) {
      console.log('✅ All chats already have branches!');
      return;
    }
    
    // Step 3: Create default branches for chats without them
    console.log('\n=== Creating Default Branches ===');
    for (const chat of chatsWithoutBranches) {
      try {
        console.log(`🌿 Creating branch for chat: ${chat.title}`);
        
        const [newBranch] = await sql`
          insert into "branch" ("id", "chatId", "name", "isActive", "createdAt", "updatedAt")
          values (gen_random_uuid()::text, ${chat.id}, 'Main Branch', true, now(), now())
          returning id, name
        `;
        
        console.log(`   ✅ Created branch: ${newBranch.name} (ID: ${newBranch.id})`);
        
        // Check if there are any existing messages for this chat
        const existingMessages = await sql`
          select count(*)::int as count
          from "message" 
          where "chatId" = ${chat.id}
        `;
        
        if (existingMessages[0].count > 0) {
          console.log(`   📨 Found ${existingMessages[0].count} existing messages, updating them...`);
          
          // Update existing messages to use the new branch
          const updatedMessages = await sql`
            update "message" 
            set "branchId" = ${newBranch.id}
            where "chatId" = ${chat.id} and "branchId" is null
            returning id
          `;
          
          console.log(`   ✅ Updated ${updatedMessages.length} messages to use new branch`);
        }
        
      } catch (error) {
        console.error(`   ❌ Failed to create branch for chat ${chat.title}:`, error.message);
      }
    }
    
    // Step 4: Verify the fix
    console.log('\n=== Verification ===');
    const [{ count: finalBranchCount }] = await sql`select count(*)::int as count from "branch"`;
    console.log('Final branch count:', finalBranchCount);
    
    const chatsStillWithoutBranches = await sql`
      select count(*)::int as count
      from "chat" c
      left join "branch" b on c.id = b."chatId"
      where b.id is null
    `;
    
    if (chatsStillWithoutBranches[0].count === 0) {
      console.log('✅ All chats now have branches!');
    } else {
      console.log(`⚠️ ${chatsStillWithoutBranches[0].count} chats still don't have branches`);
    }
    
    // Step 5: Check message distribution
    console.log('\n=== Message Distribution ===');
    const messageStats = await sql`
      select 
        c.title,
        count(m.id) as message_count,
        count(distinct m."branchId") as branch_count
      from "chat" c
      left join "message" m on c.id = m."chatId"
      group by c.id, c.title
      order by c."createdAt"
    `;
    
    console.log('Message distribution by chat:');
    messageStats.forEach((stat) => {
      console.log(`  ${stat.title}: ${stat.message_count} messages, ${stat.branch_count} branches`);
    });
    
    console.log('\n✅ Chat fixing completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

fixExistingChats();
