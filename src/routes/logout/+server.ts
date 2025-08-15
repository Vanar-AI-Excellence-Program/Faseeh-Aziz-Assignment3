import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
  // Clear the session cookie
  cookies.delete('authjs.session-token', { path: '/' });
  cookies.delete('authjs.csrf-token', { path: '/' });
  cookies.delete('authjs.callback-url', { path: '/' });
  
  // Redirect to login page
  throw redirect(303, '/login');
};

export const GET: RequestHandler = async ({ cookies }) => {
  // Clear the session cookie
  cookies.delete('authjs.session-token', { path: '/' });
  cookies.delete('authjs.csrf-token', { path: '/' });
  cookies.delete('authjs.callback-url', { path: '/' });
  
  // Redirect to login page
  throw redirect(303, '/login');
};


