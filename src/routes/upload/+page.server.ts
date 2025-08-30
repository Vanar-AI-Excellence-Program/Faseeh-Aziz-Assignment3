import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  
  if (!session?.user?.id) {
    throw redirect(302, '/login');
  }

  // Get user data
  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id));

  if (!userData) {
    throw redirect(302, '/login');
  }

  return {
    user: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    }
  };
};
