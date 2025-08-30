import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/local';
const client = postgres(connectionString);

async function checkData() {
  try {
    console.log('🔍 Checking RAG data...\n');

    // Check documents
    const documents = await client`SELECT COUNT(*) as count FROM documents`;
    console.log(`📄 Documents: ${documents[0].count}`);

    // Check chunks
    const chunks = await client`SELECT COUNT(*) as count FROM chunks`;
    console.log(`🧩 Chunks: ${chunks[0].count}`);

    // Check embeddings
    const embeddings = await client`SELECT COUNT(*) as count FROM embeddings`;
    console.log(`🔢 Embeddings: ${embeddings[0].count}`);

    // Show sample data if exists
    if (documents[0].count > 0) {
      console.log('\n📄 Sample documents:');
      const sampleDocs = await client`SELECT id, name, created_at FROM documents LIMIT 3`;
      sampleDocs.forEach(doc => {
        console.log(`  - ID: ${doc.id}, Name: ${doc.name}, Created: ${doc.created_at}`);
      });
    }

    if (chunks[0].count > 0) {
      console.log('\n🧩 Sample chunks:');
      const sampleChunks = await client`SELECT id, document_id, LEFT(content, 50) as preview FROM chunks LIMIT 3`;
      sampleChunks.forEach(chunk => {
        console.log(`  - ID: ${chunk.id}, Doc: ${chunk.document_id}, Preview: ${chunk.preview}...`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await client.end();
  }
}

checkData().catch(console.error);
