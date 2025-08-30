import { generateText } from './index';
import { getEmbedding } from '../../api';

/**
 * Test script to verify AI utilities work in your main project
 * Run this with: pnpm tsx src/lib/ai/test-ai.ts
 */

async function testAIUtilities() {
  console.log('🧪 Testing AI Utilities in Main Project\n');

  try {
    // Test 1: Text Generation
    console.log('📝 Testing Text Generation...');
    const textResult = await generateText({
      prompt: 'Write a short poem about programming',
      maxTokens: 200,
      temperature: 0.8
    });
    
    console.log('✅ Text Generation Success!');
    console.log(`📊 Generated ${textResult.text.length} characters`);
    console.log(`🔢 Tokens used: ${textResult.usage.totalTokens}`);
    console.log(`🎯 Finish reason: ${textResult.finishReason}\n`);

    // Test 2: Embeddings via API Helper
    console.log('🔢 Testing Embeddings via API Helper...');
    
    // Add debug logs before the API call
    console.log('🔍 Before getEmbedding call - Request text: Hello world, this is a test for embeddings');
    
    const embeddingResult = await getEmbedding('Hello world, this is a test for embeddings');
    
    // Add debug logs after the API call
    console.log('✅ After getEmbedding call - Response:', embeddingResult);
    
    console.log('✅ Embeddings Success!');
    console.log(`📊 Embedding dimensions: ${embeddingResult.embedding.length}`);
    console.log(`🔢 First 5 values: [${embeddingResult.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);

    console.log('\n🎉 All AI utilities are working correctly!');
    console.log('🚀 Your chatbot is ready to use AI Gateway and API helpers!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('AI Gateway')) {
      console.log('\n💡 To fix this:');
      console.log('1. Make sure AI_GATEWAY_API_KEY is set in your .env file');
      console.log('2. Verify the API key is valid');
      console.log('3. Check if the AI Gateway service is accessible');
    } else if (error.message.includes('API')) {
      console.log('\n💡 To fix API issues:');
      console.log('1. Make sure your backend server is running');
      console.log('2. Check that the /api/embed endpoint is accessible');
      console.log('3. Verify your environment variables are set correctly');
    }
  }
}

// Run the test
testAIUtilities().catch(console.error);
