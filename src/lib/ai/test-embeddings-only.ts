import { getEmbedding } from '../../api';

/**
 * Test script to verify embeddings work using the new API helper
 * Run this with: pnpm tsx src/lib/ai/test-embeddings-only.ts
 */

async function testEmbeddings() {
  console.log('🧪 Testing Embeddings via API Helper\n');

  try {
    console.log('🔢 Testing Embeddings...');
    
    // Add debug logs before the API call
    console.log('🔍 Before getEmbedding call - Request text: Hello world, this is a test for embeddings');
    
    const embeddingResult = await getEmbedding('Hello world, this is a test for embeddings');
    
    // Add debug logs after the API call
    console.log('✅ After getEmbedding call - Response:', embeddingResult);
    
    console.log('✅ Embeddings Success!');
    console.log(`📊 Embedding dimensions: ${embeddingResult.embedding.length}`);
    console.log(`🔢 First 5 values: [${embeddingResult.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);

    console.log('\n🎉 Embeddings are working correctly!');
    console.log('🚀 Your chatbot can now use the API helper for embeddings!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('API')) {
      console.log('\n💡 To fix this:');
      console.log('1. Make sure your backend server is running');
      console.log('2. Check that the /api/embed endpoint is accessible');
      console.log('3. Verify your environment variables are set correctly');
    }
  }
}

// Run the test
testEmbeddings().catch(console.error);
