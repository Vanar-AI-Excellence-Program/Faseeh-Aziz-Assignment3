import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, session } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  // Try Auth.js session first
  try {
    const authSession = await locals.auth();
    if (authSession?.user?.id) {
      // Always fetch fresh user data from database to get latest role
      const [userData] = await db.select().from(user).where(eq(user.id, authSession.user.id));
      if (!userData || userData.disabled || userData.role !== 'admin') {
        throw redirect(303, '/user');
      }

      // Fetch all users
      const allUsers = await db.select().from(user);

      return { 
        users: allUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          disabled: u.disabled,
          emailVerified: u.emailVerified
        }))
      };
    }
  } catch (error) {
    // Auth.js session failed, try manual session
  }

  // Fallback to manual session check
  const sessionToken = cookies.get('authjs.session-token');
  if (!sessionToken) throw redirect(303, '/login');

  const [sessionData] = await db.select().from(session).where(eq(session.sessionToken, sessionToken));
  if (!sessionData || sessionData.expires <= new Date()) throw redirect(303, '/login');

  const [userData] = await db.select().from(user).where(eq(user.id, sessionData.userId));
  if (!userData || userData.disabled || userData.role !== 'admin') throw redirect(303, '/user');

  // Fetch all users
  const allUsers = await db.select().from(user);

  return { 
    users: allUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      disabled: u.disabled,
      emailVerified: u.emailVerified
    }))
  };
};

export const actions: Actions = {
  changeRole: async ({ request, locals, cookies }) => {
    // Check if current user is admin
    let isAdmin = false;
    
    try {
      const authSession = await locals.auth();
      if (authSession?.user?.id) {
        const [userData] = await db.select().from(user).where(eq(user.id, authSession.user.id));
        isAdmin = userData?.role === 'admin';
      }
    } catch (error) {
      // Fallback to manual session
      const sessionToken = cookies.get('authjs.session-token');
      if (sessionToken) {
        const [sessionData] = await db.select().from(session).where(eq(session.sessionToken, sessionToken));
        if (sessionData && sessionData.expires > new Date()) {
          const [userData] = await db.select().from(user).where(eq(user.id, sessionData.userId));
          isAdmin = userData?.role === 'admin';
        }
      }
    }

    if (!isAdmin) {
      return fail(403, { message: 'Admin access required' });
    }

    const formData = await request.formData();
    const userId = String(formData.get('userId'));
    const newRole = String(formData.get('role'));

    if (!userId || !newRole) {
      return fail(400, { message: 'Missing required fields' });
    }

    if (!['admin', 'user'].includes(newRole)) {
      return fail(400, { message: 'Invalid role' });
    }

    try {
      await db.update(user).set({ role: newRole }).where(eq(user.id, userId));
      return { success: true, message: 'User role updated successfully' };
    } catch (error) {
      console.error('Error updating user role:', error);
      return fail(500, { message: 'Failed to update user role' });
    }
  },

  toggleUserStatus: async ({ request, locals, cookies }) => {
    // Check if current user is admin
    let isAdmin = false;
    
    try {
      const authSession = await locals.auth();
      if (authSession?.user?.id) {
        const [userData] = await db.select().from(user).where(eq(user.id, authSession.user.id));
        isAdmin = userData?.role === 'admin';
      }
    } catch (error) {
      // Fallback to manual session
      const sessionToken = cookies.get('authjs.session-token');
      if (sessionToken) {
        const [sessionData] = await db.select().from(session).where(eq(session.sessionToken, sessionToken));
        if (sessionData && sessionData.expires > new Date()) {
          const [userData] = await db.select().from(user).where(eq(user.id, sessionData.userId));
          isAdmin = userData?.role === 'admin';
        }
      }
    }

    if (!isAdmin) {
      return fail(403, { message: 'Admin access required' });
    }

    const formData = await request.formData();
    const userId = String(formData.get('userId'));

    if (!userId) {
      return fail(400, { message: 'Missing user ID' });
    }

    try {
      // Get current user status
      const [currentUser] = await db.select().from(user).where(eq(user.id, userId));
      if (!currentUser) {
        return fail(404, { message: 'User not found' });
      }

      // Toggle disabled status
      const newStatus = !currentUser.disabled;
      await db.update(user).set({ disabled: newStatus }).where(eq(user.id, userId));
      
      const action = newStatus ? 'disabled' : 'enabled';
      return { success: true, message: `User ${action} successfully` };
    } catch (error) {
      console.error('Error toggling user status:', error);
      return fail(500, { message: 'Failed to toggle user status' });
    }
  }
};
