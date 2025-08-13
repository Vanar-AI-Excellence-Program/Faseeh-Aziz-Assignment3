import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { session as sessionTable, user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ cookies }) => {
  const token = cookies.get('authjs.session-token');
  if (!token) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const [session] = await db.select().from(sessionTable).where(eq(sessionTable.sessionToken, token));
  if (!session) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const [me] = await db.select().from(userTable).where(eq(userTable.id, session.userId));
  if (!me) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const dest = me.role === 'admin' ? '/dashboard' : '/user';
  return new Response(null, { status: 303, headers: { Location: dest } });
};


