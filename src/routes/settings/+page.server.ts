import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw redirect(303, '/login');

  // Type assertion for the user role
  const userRole = (session.user as any).role;

  return { 
    user: { 
      id: session.user.id,
      email: session.user.email, 
      name: session.user.name, 
      role: userRole
    } 
  };
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    const session = await locals.auth();
    if (!session?.user?.id) throw redirect(303, '/login');

    const formData = await request.formData();
    const name = String(formData.get('name') ?? '').trim();
    const currentPassword = String(formData.get('currentPassword') ?? '');
    const newPassword = String(formData.get('newPassword') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (!name) {
      return fail(400, { error: 'Name is required' });
    }

    try {
      // Get current user data
      const [currentUser] = await db.select().from(user).where(eq(user.id, session.user.id));
      if (!currentUser) {
        return fail(404, { error: 'User not found' });
      }

      // Update name
      const updateData: any = { name };

      // Handle password update if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          return fail(400, { error: 'New passwords do not match' });
        }

        if (newPassword.length < 8) {
          return fail(400, { error: 'Password must be at least 8 characters long' });
        }

        // If user has a current password (not OAuth user), verify it
        if (currentUser.hashedPassword) {
          if (!currentPassword) {
            return fail(400, { error: 'Current password is required to change password' });
          }

          const isValidPassword = await compare(currentPassword, currentUser.hashedPassword);
          if (!isValidPassword) {
            return fail(400, { error: 'Current password is incorrect' });
          }
        }

        // Hash new password
        updateData.hashedPassword = await hash(newPassword, 10);
      }

      // Update user in database
      await db.update(user).set(updateData).where(eq(user.id, session.user.id));

      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      console.error('Profile update error:', error);
      return fail(500, { error: 'Failed to update profile' });
    }
  }
};


