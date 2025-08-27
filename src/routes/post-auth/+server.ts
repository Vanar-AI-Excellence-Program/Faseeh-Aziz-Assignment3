import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, session as sessionTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, cookies, url }) => {
  // Check for OAuth success parameters
  const oauthProvider = url.searchParams.get('oauth');
  const oauthSuccess = url.searchParams.get('success');
  
  if (oauthProvider && oauthSuccess === 'true') {
    console.log(`OAuth ${oauthProvider} authentication successful`);
    // In a real implementation, you would create a session here
    // For now, redirect to user dashboard
    throw redirect(302, '/user');
  }
  
  // Check session manually since global auth handle is disabled
  const sessionToken = cookies.get('authjs.session-token');
  let session = null;
  
  if (sessionToken) {
    try {
      const [sessionData] = await db.select().from(sessionTable).where(eq(sessionTable.sessionToken, sessionToken));
      if (sessionData && sessionData.expires > new Date()) {
        const [userData] = await db.select().from(user).where(eq(user.id, sessionData.userId));
        if (userData) {
          session = { user: userData };
        }
      }
    } catch (error) {
      // Session validation failed
    }
  }
  
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


