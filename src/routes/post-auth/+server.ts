import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, cookies }) => {
  const session = await locals.auth();
  
  if (!session?.user) {
    throw redirect(303, '/login');
  }

  // Ensure role is present; if missing, fetch from DB (database session strategy may omit role)
  let role: string | undefined = (session.user as any).role;
  let userRecord: any = null;
  
  if (session.user.id) {
    try {
      const [u] = await db.select().from(user).where(eq(user.id, session.user.id));
      userRecord = u;
      role = u?.role ?? role;
      
      // Check if user is disabled
      if (u?.disabled) {
        console.log(`Blocking disabled user from accessing protected pages: ${u.email}`);
        console.log(`Redirecting to: /login?error=disabled&message=${encodeURIComponent('Account is disabled. Please contact an administrator.')}`);
        
        // Clear the Auth.js session cookie to properly log out the user
        cookies.delete('authjs.session-token', { path: '/' });
        
        // Redirect back to login with error message
        throw redirect(303, `/login?error=disabled&message=${encodeURIComponent('Account is disabled. Please contact an administrator.')}`);
      }
    } catch {}
  }

  // Redirect based on role
  const dest = role === 'admin' ? '/dashboard' : '/user';
  throw redirect(303, dest);
};


