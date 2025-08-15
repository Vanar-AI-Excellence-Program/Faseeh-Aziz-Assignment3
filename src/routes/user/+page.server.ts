import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw redirect(303, '/login');
  
  // Type assertion for the user role
  const userRole = (session.user as any).role;
  if (userRole === 'admin') throw redirect(303, '/dashboard');
  
  return { name: session.user.name || 'User' };
};


