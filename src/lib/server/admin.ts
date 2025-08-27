import { db } from './db';
import { user } from './db/schema';

export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  disabled: boolean;
}

/**
 * Check if a user can be modified by an admin
 */
export function canModifyUser(adminUser: AdminUser, targetUserId: string, action: 'role' | 'status'): boolean {
  // Admin cannot modify themselves
  if (adminUser.id === targetUserId) {
    return false;
  }
  
  return true;
}

/**
 * Validate role changes
 */
export function validateRoleChange(currentRole: string, newRole: string): boolean {
  return ['admin', 'user'].includes(newRole);
}

/**
 * Get user statistics for admin dashboard
 */
export async function getUserStats() {
  const allUsers = await db.select({ 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    disabled: user.disabled 
  }).from(user);
  
  return {
    total: allUsers.length,
    admins: allUsers.filter((u) => u.role === 'admin').length,
    disabled: allUsers.filter((u) => u.disabled).length,
    users: allUsers
  };
}
