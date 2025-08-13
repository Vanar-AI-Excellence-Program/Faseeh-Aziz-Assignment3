import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const token = cookies.get('authjs.session-token');
  if (!token) return { viewer: null };
  const [session] = await db.select().from(sessions).where(eq(sessions.sessionToken, token));
  if (!session) return { viewer: null };
  const [me] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!me || me.disabled) return { viewer: null };
  return { viewer: { id: me.id, email: me.email, name: me.name, role: me.role } };
};


