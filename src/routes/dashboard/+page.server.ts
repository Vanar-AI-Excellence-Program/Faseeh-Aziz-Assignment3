import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import { canModifyUser, validateRoleChange, getUserStats } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw redirect(303, '/login');

  // Type assertion for the user role
  const userRole = (session.user as any).role;
  if (userRole !== 'admin') throw redirect(303, '/');

  const stats = await getUserStats();
  return { 
    user: { 
      email: session.user.email, 
      name: session.user.name, 
      role: userRole
    }, 
    users: stats.users, 
    stats 
  };
};

export const actions: Actions = {
  changeRole: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user?.id) return fail(401, { message: 'Unauthorized' });

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') return fail(403, { message: 'Admin access required' });

    const formData = await request.formData();
    const userId = String(formData.get('userId'));
    const newRole = String(formData.get('role'));

    if (!userId || !newRole) {
      return fail(400, { message: 'Missing required fields' });
    }

    if (!validateRoleChange('', newRole)) {
      return fail(400, { message: 'Invalid role' });
    }

    const adminUser = {
      id: session.user.id,
      email: session.user.email || null,
      name: session.user.name || null,
      role: userRole,
      disabled: false
    };

    if (!canModifyUser(adminUser, userId, 'role')) {
      return fail(400, { message: 'Cannot modify yourself' });
    }

    try {
      await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
      return { success: true, message: `User role updated to ${newRole}` };
    } catch (error) {
      console.error('Error updating user role:', error);
      return fail(500, { message: 'Failed to update user role' });
    }
  },

  toggleUserStatus: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user?.id) return fail(401, { message: 'Unauthorized' });

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') return fail(403, { message: 'Admin access required' });

    const formData = await request.formData();
    const userId = String(formData.get('userId'));
    const action = String(formData.get('action')); // 'enable' or 'disable'

    if (!userId || !action) {
      return fail(400, { message: 'Missing required fields' });
    }

    if (!['enable', 'disable'].includes(action)) {
      return fail(400, { message: 'Invalid action' });
    }

    const adminUser = {
      id: session.user.id,
      email: session.user.email || null,
      name: session.user.name || null,
      role: userRole,
      disabled: false
    };

    if (!canModifyUser(adminUser, userId, 'status')) {
      return fail(400, { message: 'Cannot modify yourself' });
    }

    try {
      const newStatus = action === 'disable';
      await db.update(users).set({ disabled: newStatus }).where(eq(users.id, userId));
      
      const statusText = newStatus ? 'disabled' : 'enabled';
      return { success: true, message: `User ${statusText} successfully` };
    } catch (error) {
      console.error('Error updating user status:', error);
      return fail(500, { message: 'Failed to update user status' });
    }
  }
};