import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, session } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
  // Check if user is already authenticated
  const session = await locals.auth();
  if (session?.user) {
    const dest = (session.user as any).role === 'admin' ? '/dashboard' : '/user';
    throw redirect(303, dest);
  }

  // Handle other Auth.js errors if needed
  const error = url.searchParams.get('error');
  if (error && error !== 'OAuthAccountExists') {
    return {
      error: {
        type: 'auth_error',
        message: 'An error occurred during sign in. Please try again.',
        provider: null
      }
    };
  }
  
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');

    if (!email || !password) return fail(400, { message: 'Email and password are required.' });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !user.hashedPassword) return fail(400, { message: 'Invalid credentials.' });
    if (user.disabled) return fail(403, { message: 'Account is disabled.' });

    const ok = await compare(password, user.hashedPassword);
    if (!ok) return fail(400, { message: 'Invalid credentials.' });

    // Create a session token manually for now
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Insert session into database
    await db.insert(session).values({
      sessionToken,
      userId: user.id,
      expires
    });

    // Set the session cookie
    cookies.set('authjs.session-token', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires
    });

    // Redirect based on user role
    const destination = user.role === 'admin' ? '/dashboard' : '/user';
    throw redirect(303, destination);
  }
};