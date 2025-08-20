import { handle as authHandle } from './auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Add cache control headers to all responses
  const response = await authHandle({ event, resolve });
  
  if (response) {
    try {
      // Create new headers object to avoid immutable header issues
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      newHeaders.set('Pragma', 'no-cache');
      newHeaders.set('Expires', '0');
      
      // Create new response with updated headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (error) {
      console.log('Could not modify response headers:', error);
      // Return original response if header modification fails
      return response;
    }
  }
  
  return response;
};