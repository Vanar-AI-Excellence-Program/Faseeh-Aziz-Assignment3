import { env } from '$env/dynamic/private';

export interface TextGenerationOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TextGenerationResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

/**
 * Generate text using OpenAI directly (Priority 1) or Google Gemini as fallback (Priority 2)
 */
export async function generateText(options: TextGenerationOptions): Promise<TextGenerationResult> {
  const {
    prompt,
    model = 'gpt-3.5-turbo',
    maxTokens = 1000,
    temperature = 0.7
  } = options;

  try {
    // Use Google Gemini directly
    if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log('🔄 Using Google Gemini directly');
      
      try {
        // Try to import Google Generative AI package
        let GoogleGenerativeAI;
        try {
          const module = await import('@google/generative-ai');
          GoogleGenerativeAI = module.GoogleGenerativeAI;
        } catch (importError) {
          console.log('⚠️ Google Generative AI package not installed, using local responses');
          return getLocalFallbackResponse(prompt);
        }
        
        const genAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
        const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return {
          text,
          usage: {
            inputTokens: 0, // Gemini doesn't provide token usage in the same way
            outputTokens: 0,
            totalTokens: 0
          },
          finishReason: 'stop'
        };
      } catch (geminiError: any) {
        console.error('❌ Google Gemini failed:', geminiError);
        return getLocalFallbackResponse(prompt);
      }
    } 
    // Local fallback if no Google Gemini key
    else {
      console.log('⚠️ No Google Gemini API key configured, using local fallback');
      return getLocalFallbackResponse(prompt);
    }

  } catch (error: any) {
    console.error('AI API failed:', error);
    throw new Error(`AI API failed: ${error.message}`);
  }
}

/**
 * Helper function to get local fallback responses
 */
function getLocalFallbackResponse(prompt: string): TextGenerationResult {
  // Simple local fallback responses based on common questions
  const fallbackResponses = [
    "I'm a local AI assistant that can help you with basic questions. However, I don't have access to external AI services right now. Please check your API configuration or try again later.",
    "Hello! I'm here to help, but I'm currently running in local mode without external AI services. You can still ask me basic questions, and I'll do my best to assist you.",
    "I'm operating in offline mode due to missing API configuration. While I can't provide advanced AI responses, I'm here to help with basic support and guidance."
  ];
  
  // Simple keyword-based responses
  let response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  
  if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
    response = "Hello! I'm your local AI assistant. I'm currently running without external AI services, but I'm here to help with basic questions.";
  } else if (prompt.toLowerCase().includes('help')) {
    response = "I'm here to help! I'm currently running in local mode. You can ask me basic questions, and I'll assist you as best I can.";
  }
  
  return {
    text: response,
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    finishReason: 'local_fallback'
  };
}

/**
 * Helper function to get local fallback streaming responses
 */
function getLocalFallbackStream(prompt: string) {
  const fallbackResponse = "I'm currently running without external AI services. I can help with basic questions, but for advanced AI responses, please install the required packages or configure your API keys.";
  
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(fallbackResponse));
      controller.close();
    }
  });
  
  return {
    textStream: stream,
    usage: Promise.resolve({ inputTokens: 0, outputTokens: 0, totalTokens: 0 }),
    finishReason: Promise.resolve('local_fallback')
  };
}

/**
 * Stream text generation for real-time output
 */
export async function streamTextGeneration(options: TextGenerationOptions) {
  const {
    prompt,
    model = 'gpt-3.5-turbo',
    maxTokens = 1000,
    temperature = 0.7
  } = options;

  try {
    // Use Google Gemini directly
    if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log('🔄 Using Google Gemini directly for streaming');
      
      try {
        // Try to import Google Generative AI package
        let GoogleGenerativeAI;
        try {
          const module = await import('@google/generative-ai');
          GoogleGenerativeAI = module.GoogleGenerativeAI;
        } catch (importError) {
          console.log('⚠️ Google Generative AI package not installed, using local responses for streaming');
          return getLocalFallbackStream(prompt);
        }
        
        const genAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
        const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // For streaming, we'll simulate it with Gemini since it doesn't have native streaming
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Create a simple stream-like response
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(text));
            controller.close();
          }
        });
        
        return {
          textStream: stream,
          usage: Promise.resolve({ inputTokens: 0, outputTokens: 0, totalTokens: 0 }),
          finishReason: Promise.resolve('stop')
        };
      } catch (geminiError: any) {
        console.error('❌ Google Gemini streaming failed:', geminiError);
        return getLocalFallbackStream(prompt);
      }
    } 
    // Local fallback if no Google Gemini key
    else {
      console.log('⚠️ No Google Gemini API key configured, using local fallback for streaming');
      return getLocalFallbackStream(prompt);
    }
  } catch (error) {
    console.error('Streaming AI API failed:', error);
    throw error;
  }
}
