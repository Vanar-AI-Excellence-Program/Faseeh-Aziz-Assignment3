import { signOut } from '@auth/sveltekit/client';

export async function handleLogout() {
  try {
    // Use Auth.js client-side signOut
    await signOut({ 
      callbackUrl: '/login'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback: redirect to login page
    window.location.href = '/login';
  }
}
