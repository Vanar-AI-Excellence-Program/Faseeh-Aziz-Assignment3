import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { user, session } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import { canModifyUser, validateRoleChange, getUserStats } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  // Try Auth.js session first
  try {
    const authSession = await locals.auth();
    if (authSession?.user?.id) {
      const userRole = (authSession.user as any).role;
      if (userRole !== 'admin') throw redirect(303, '/');

      const stats = await getUserStats();
      return { 
        user: { 
          id: authSession.user.id,
          email: authSession.user.email, 
          name: authSession.user.name, 
          role: userRole
        }, 
        users: stats.users, 
        stats 
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
  if (!userData || userData.disabled || userData.role !== 'admin') throw redirect(303, '/');

  const stats = await getUserStats();
  return { 
    user: { 
      id: userData.id,
      email: userData.email, 
      name: userData.name, 
      role: userData.role
    }, 
    users: stats.users, 
    stats 
  };
};

export const actions: Actions = {
  changeRole: async ({ request, locals, cookies }) => {
    // Check session (try Auth.js first, then manual)
    let userRole = 'user';
    let userId = '';

    try {
      const authSession = await locals.auth();
      if (authSession?.user?.id) {
        userRole = (authSession.user as any).role;
        userId = authSession.user.id;
      }
    } catch (error) {
      // Fallback to manual session
      const sessionToken = cookies.get('authjs.session-token');
      if (sessionToken) {
        const [sessionData] = await db.select().from(session).where(eq(session.sessionToken, sessionToken));
        if (sessionData && sessionData.expires > new Date()) {
          const [userData] = await db.select().from(user).where(eq(user.id, sessionData.userId));
          if (userData && userData.role === 'admin') {
            userRole = userData.role;
            userId = userData.id;
          }
        }
      }
    }

    if (userRole !== 'admin') return fail(403, { message: 'Admin access required' });

    const formData = await request.formData();
    const targetUserId = String(formData.get('userId'));
    const newRole = String(formData.get('role'));

    if (!targetUserId || !newRole) {
      return fail(400, { message: 'Missing required fields' });
    }

    if (!validateRoleChange('', newRole)) {
      return fail(400, { message: 'Invalid role' });
    }

    const adminUser = {
      id: userId,
      email: null,
      name: null,
      role: userRole,
      disabled: false
    };

    if (!canModifyUser(adminUser, targetUserId, 'role')) {
      return fail(400, { message: 'Cannot modify yourself' });
    }

    try {
      await db.update(user).set({ role: newRole }).where(eq(user.id, targetUserId));
      return { success: true, message: `User role updated to ${newRole}` };
    } catch (error) {
      console.error('Error updating user role:', error);
      return fail(500, { message: 'Failed to update user role' });
    }
  },

  toggleUserStatus: async ({ request, locals, cookies }) => {
    // Check session (try Auth.js first, then manual)
    let userRole = 'user';
    let userId = '';

    try {
      const authSession = await locals.auth();
      if (authSession?.user?.id) {
        userRole = (authSession.user as any).role;
        userId = authSession.user.id;
      }
    } catch (error) {
      // Fallback to manual session
      const sessionToken = cookies.get('authjs.session-token');
      if (sessionToken) {
        const [sessionData] = await db.select().from(session).where(eq(session.sessionToken, sessionToken));
        if (sessionData && sessionData.expires > new Date()) {
          const [userData] = await db.select().from(user).where(eq(user.id, sessionData.userId));
          if (userData && userData.role === 'admin') {
            userRole = userData.role;
            userId = userData.id;
          }
        }
      }
    }

    if (userRole !== 'admin') return fail(403, { message: 'Admin access required' });

    const formData = await request.formData();
    const targetUserId = String(formData.get('userId'));
    const action = String(formData.get('action')); // 'enable' or 'disable'

    if (!targetUserId || !action) {
      return fail(400, { message: 'Missing required fields' });
    }

    if (!['enable', 'disable'].includes(action)) {
      return fail(400, { message: 'Invalid action' });
    }

    const adminUser = {
      id: userId,
      email: null,
      name: null,
      role: userRole,
      disabled: false
    };

    if (!canModifyUser(adminUser, targetUserId, 'status')) {
      return fail(400, { message: 'Cannot modify yourself' });
    }

    try {
      const newStatus = action === 'disable';
      await db.update(user).set({ disabled: newStatus }).where(eq(user.id, targetUserId));
      
      const statusText = newStatus ? 'disabled' : 'enabled';
      return { success: true, message: `User ${statusText} successfully` };
    } catch (error) {
      console.error('Error updating user status:', error);
      return fail(500, { message: 'Failed to update user status' });
    }
  }
};