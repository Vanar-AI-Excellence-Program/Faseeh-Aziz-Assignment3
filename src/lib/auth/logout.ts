import { signOut } from '@auth/sveltekit/client';

export async function handleLogout() {
  try {
    // Use Auth.js client-side signOut
    await signOut({ 
      callbackUrl: '/'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback: redirect to home page
    window.location.href = '/';
  }
}
