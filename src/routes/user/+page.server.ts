import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('authjs.session-token');
  if (!token) throw redirect(303, '/login');
  const [session] = await db.select().from(sessions).where(eq(sessions.sessionToken, token));
  if (!session) throw redirect(303, '/login');
  const [me] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!me || me.disabled) throw redirect(303, '/login');
  if (me.role === 'admin') throw redirect(303, '/dashboard');
  return { name: me.name ?? me.firstName ?? 'User' };
};


