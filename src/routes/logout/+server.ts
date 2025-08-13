import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function signOut(cookies: import('@sveltejs/kit').Cookies) {
  const token = cookies.get('authjs.session-token');
  if (token) {
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
    cookies.delete('authjs.session-token', { path: '/' });
  }
}

export const POST: RequestHandler = async ({ cookies }) => {
  await signOut(cookies);
  return new Response(null, { status: 303, headers: { Location: '/login' } });
};

export const GET: RequestHandler = async ({ cookies }) => {
  await signOut(cookies);
  return new Response(null, { status: 303, headers: { Location: '/login' } });
};


