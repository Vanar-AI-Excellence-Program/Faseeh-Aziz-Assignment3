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

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user) throw redirect(303, '/login');
  if (user.role !== 'admin' || user.disabled) throw redirect(303, '/');

  const allUsers = await db.select({ id: users.id, email: users.email, role: users.role, disabled: users.disabled }).from(users);
  const stats = {
    total: allUsers.length,
    admins: allUsers.filter((u) => u.role === 'admin').length,
    disabled: allUsers.filter((u) => u.disabled).length
  };
  return { user: { email: user.email, name: user.name, role: user.role }, users: allUsers, stats };
};