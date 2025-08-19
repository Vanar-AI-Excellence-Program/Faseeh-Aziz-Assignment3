import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  
  if (!session) {
    throw redirect(302, '/login');
  }

  // Check if user is admin and redirect to dashboard
  if (session.user.role === 'admin') {
    throw redirect(302, '/dashboard');
  }

  // Return user data for the page
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role
    }
  };
};


