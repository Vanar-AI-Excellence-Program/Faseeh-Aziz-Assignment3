import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw redirect(303, '/login');

  // Type assertion for the user role
  const userRole = (session.user as any).role;

  return { 
    user: { 
      email: session.user.email, 
      name: session.user.name, 
      role: userRole
    } 
  };
};


