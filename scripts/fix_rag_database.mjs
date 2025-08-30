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

async function fixRAGDatabase() {
  try {
    console.log('🔧 Fixing RAG database schema...');
    
    // Check if vector extension exists
    const vectorExtResult = await db.execute('SELECT 1 FROM pg_extension WHERE extname = \'vector\'');
    if (vectorExtResult.length === 0) {
      console.log('📦 Installing vector extension...');
      await db.execute('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ Vector extension installed');
    } else {
      console.log('✅ Vector extension already exists');
    }
    
    // Check current embeddings table structure
    const tableInfo = await db.execute(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'embeddings' AND column_name = 'embedding'
    `);
    
    console.log('📊 Current embeddings table structure:', tableInfo);
    
    if (tableInfo.length > 0 && tableInfo[0].data_type === 'USER-DEFINED' && tableInfo[0].udt_name === 'vector') {
      console.log('✅ Embeddings table already has vector type');
    } else {
      console.log('🔄 Converting embeddings table to vector type...');
      
      // Drop existing table and recreate with proper vector type
      await db.execute('DROP TABLE IF EXISTS embeddings CASCADE');
      
      await db.execute(`
        CREATE TABLE embeddings (
          id SERIAL PRIMARY KEY,
          chunk_id INTEGER NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
          embedding vector(768) NOT NULL
        )
      `);
      
      // Create indexes
      await db.execute('CREATE INDEX embeddings_embedding_idx ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)');
      await db.execute('CREATE INDEX embeddings_chunk_id_idx ON embeddings (chunk_id)');
      
      console.log('✅ Embeddings table recreated with vector type');
    }
    
    // Check if we have any documents
    const docCount = await db.execute('SELECT COUNT(*) as count FROM documents');
    const chunkCount = await db.execute('SELECT COUNT(*) as count FROM chunks');
    const embeddingCount = await db.execute('SELECT COUNT(*) as count FROM embeddings');
    
    console.log('📊 Database stats:');
    console.log(`  - Documents: ${docCount[0]?.count || 0}`);
    console.log(`  - Chunks: ${chunkCount[0]?.count || 0}`);
    console.log(`  - Embeddings: ${embeddingCount[0]?.count || 0}`);
    
    if ((docCount[0]?.count || 0) === 0) {
      console.log('⚠️ No documents found. You need to upload documents first for RAG to work.');
    } else if ((embeddingCount[0]?.count || 0) === 0) {
      console.log('⚠️ No embeddings found. You need to re-ingest your documents to generate embeddings.');
    } else {
      console.log('✅ RAG database is ready!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing RAG database:', error);
  } finally {
    await client.end();
  }
}

fixRAGDatabase();
