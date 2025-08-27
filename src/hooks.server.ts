import type { Handle } from '@sveltejs/kit';
import { handle as authHandle } from './auth';

export const handle: Handle = async ({ event, resolve }) => {
  // Handle Auth.js for all routes (including auth routes)
  const authResponse = await authHandle({ event, resolve });
  if (authResponse) return authResponse;
  
  // Add cache control headers to all responses
  let response;
  
  // Continue with normal request handling
  response = await resolve(event);
  
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