import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth();
  
  if (!session?.user) {
    throw redirect(303, '/login');
  }

  // Ensure role is present; if missing, fetch from DB (database session strategy may omit role)
  let role: string | undefined = (session.user as any).role;
  if (!role && session.user.id) {
    try {
      const [u] = await db.select().from(users).where(eq(users.id, session.user.id));
      role = u?.role ?? undefined;
    } catch {}
  }

  // Redirect based on role
  const dest = role === 'admin' ? '/dashboard' : '/user';
  throw redirect(303, dest);
};


