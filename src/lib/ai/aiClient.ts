import { env } from '$env/dynamic/private';

// Determine which provider to use based on environment variables
export const provider = env.OPENAI_API_KEY 
  ? 'openai' 
  : env.GOOGLE_GENERATIVE_AI_API_KEY 
  ? 'gemini' 
  : 'none';

// Export provider information for use in other modules
export const aiConfig = {
  provider,
  openai: {
    apiKey: env.OPENAI_API_KEY || '',
    baseURL: env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  },
  gemini: {
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  }
};
