import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw redirect(303, '/login');

  // Always fetch fresh user data from database to get latest role
  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id));
  if (!userData) throw redirect(303, '/login');
  if (userData.disabled) throw redirect(303, `/login?error=disabled&message=${encodeURIComponent('Account is disabled. Please contact an administrator.')}`);

  return { 
    user: { 
      id: userData.id, 
      name: userData.name, 
      email: userData.email, 
      role: userData.role 
    }
  };
};
