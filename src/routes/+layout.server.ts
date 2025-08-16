import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, session } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  // Try Auth.js session first
  try {
    const authSession = await locals.auth();
    if (authSession?.user) {
      return { viewer: authSession.user };
    }
  } catch (error) {
    // Auth.js session failed, try manual session
  }

  // Fallback to manual session check
  const sessionToken = cookies.get('authjs.session-token');
  if (sessionToken) {
    try {
      const [sessionData] = await db.select().from(session).where(eq(session.sessionToken, sessionToken));
      if (sessionData && sessionData.expires > new Date()) {
        const [userData] = await db.select().from(users).where(eq(users.id, sessionData.userId));
        if (userData && !userData.disabled) {
          return { 
            viewer: { 
              id: userData.id, 
              email: userData.email, 
              name: userData.name, 
              role: userData.role 
            } 
          };
        }
      }
    } catch (error) {
      // Session validation failed
    }
  }

  return { viewer: null };
};


