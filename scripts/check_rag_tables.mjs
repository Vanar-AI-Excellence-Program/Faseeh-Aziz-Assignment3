import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Using DATABASE_URL:', url);

const sql = postgres(url, { max: 1 });

async function main() {
  try {
    const [{ now }] = await sql`select now()`;
    console.log('DB time:', now);
    
    // Check basic tables
    console.log('\n=== Basic Tables ===');
    const [{ count: userCount }] = await sql`select count(*)::int as count from "user"`;
    console.log('user rows:', userCount);
    
    const [{ count: chatCount }] = await sql`select count(*)::int as count from "chat"`;
    console.log('chat rows:', chatCount);
    
    const [{ count: messageCount }] = await sql`select count(*)::int as count from "message"`;
    console.log('message rows:', messageCount);
    
    // Check branching tables
    console.log('\n=== Branching Tables ===');
    try {
      const [{ count: branchCount }] = await sql`select count(*)::int as count from "branch"`;
      console.log('branch rows:', branchCount);
    } catch (err) {
      console.log('branch table: ERROR -', err.message);
    }
    
    try {
      const [{ count: messageBranchesCount }] = await sql`select count(*)::int as count from "messageBranches"`;
      console.log('messageBranches rows:', messageBranchesCount);
    } catch (err) {
      console.log('messageBranches table: ERROR -', err.message);
    }
    
    // Check RAG tables
    console.log('\n=== RAG Tables ===');
    try {
      const [{ count: documentsCount }] = await sql`select count(*)::int as count from "documents"`;
      console.log('documents rows:', documentsCount);
    } catch (err) {
      console.log('documents table: ERROR -', err.message);
    }
    
    try {
      const [{ count: chunksCount }] = await sql`select count(*)::int as count from "chunks"`;
      console.log('chunks rows:', chunksCount);
    } catch (err) {
      console.log('chunks table: ERROR -', err.message);
    }
    
    try {
      const [{ count: embeddingsCount }] = await sql`select count(*)::int as count from "embeddings"`;
      console.log('embeddings rows:', embeddingsCount);
    } catch (err) {
      console.log('embeddings table: ERROR -', err.message);
    }
    
    try {
      const [{ count: conversationDocumentsCount }] = await sql`select count(*)::int as count from "conversationDocuments"`;
      console.log('conversationDocuments rows:', conversationDocumentsCount);
    } catch (err) {
      console.log('conversationDocuments table: ERROR -', err.message);
    }
    
    // Check message table structure
    console.log('\n=== Message Table Structure ===');
    try {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'message' 
        ORDER BY ordinal_position
      `;
      console.log('Message table columns:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } catch (err) {
      console.log('Error checking message table structure:', err.message);
    }
    
    // Check if chunkCitations column exists
    console.log('\n=== Checking chunkCitations Column ===');
    try {
      const result = await sql`SELECT "chunkCitations" FROM "message" LIMIT 1`;
      console.log('chunkCitations column: EXISTS and accessible');
    } catch (err) {
      console.log('chunkCitations column: ERROR -', err.message);
    }
    
  } catch (err) {
    console.error('DB check failed:', err);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

main();
