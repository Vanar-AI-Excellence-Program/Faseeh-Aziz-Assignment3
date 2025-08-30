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

async function checkRAGData() {
  try {
    console.log('🔍 Checking RAG database data...\n');
    
    // Check documents
    const documents = await db.execute('SELECT * FROM documents ORDER BY id');
    console.log('📚 Documents:');
    documents.forEach(doc => {
      console.log(`  - ID: ${doc.id}, Name: "${doc.name}", Uploaded by: ${doc.uploaded_by}`);
      console.log(`    Metadata: ${JSON.stringify(doc.metadata)}`);
    });
    
    console.log('\n🧩 Chunks:');
    const chunks = await db.execute('SELECT * FROM chunks ORDER BY document_id, "order"');
    chunks.forEach(chunk => {
      console.log(`  - ID: ${chunk.id}, Document: ${chunk.document_id}, Order: ${chunk.order}`);
      console.log(`    Content: "${chunk.content.substring(0, 100)}${chunk.content.length > 100 ? '...' : ''}"`);
      console.log(`    Length: ${chunk.content.length} characters`);
    });
    
    console.log('\n🔢 Embeddings:');
    const embeddings = await db.execute('SELECT * FROM embeddings ORDER BY chunk_id');
    embeddings.forEach(embedding => {
      console.log(`  - ID: ${embedding.id}, Chunk: ${embedding.chunk_id}`);
      console.log(`    Vector dimensions: ${embedding.embedding.length}`);
    });
    
    // Test vector search
    if (chunks.length > 0) {
      console.log('\n🧪 Testing vector search...');
      const testQuery = chunks[0].content.substring(0, 50); // Use first chunk as test query
      console.log(`Test query: "${testQuery}"`);
      
      // This would require the embedding service to be running
      console.log('Note: To test vector search, you need to generate embeddings for the test query');
    }
    
  } catch (error) {
    console.error('❌ Error checking RAG data:', error);
  } finally {
    await client.end();
  }
}

checkRAGData();
