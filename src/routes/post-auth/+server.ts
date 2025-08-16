import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth();
  
  if (!session?.user) {
    throw redirect(303, '/login');
  }

  // Redirect based on role
  const dest = (session.user as any).role === 'admin' ? '/dashboard' : '/user';
  throw redirect(303, dest);
};


