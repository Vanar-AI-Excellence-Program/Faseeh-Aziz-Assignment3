import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, session, verificationToken } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { sendOtpEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ url, locals }) => {
  // Check if user is already authenticated
  const session = await locals.auth();
  if (session?.user) {
    const dest = (session.user as any).role === 'admin' ? '/dashboard' : '/user';
    throw redirect(303, dest);
  }

  // Handle Auth.js errors explicitly (e.g., OAuthAccountNotLinked)
  const error = url.searchParams.get('error');
  if (error) {
    let message = 'An error occurred during sign in. Please try again.';
    if (error === 'OAuthAccountNotLinked') {
      message = 'Another account already exists with the same email. Please sign in using your original method (e.g., Credentials)';
    } else if (error === 'OAuthAccountExists') {
      message = 'This email is already associated with a different provider.';
    }
    return { error: { type: 'auth_error', message, provider: null } };
  }
  
  return {};
};

export const actions: Actions = {
  signin: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');

    if (!email || !password) return fail(400, { action: 'signin', error: true, message: 'Email and password are required.' });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !user.hashedPassword) return fail(400, { action: 'signin', error: true, message: 'Incorrect email or password.' });
    if (user.disabled) return fail(403, { action: 'signin', error: true, message: 'Account is disabled.' });
    if (!user.emailVerified) return fail(403, { action: 'signin', error: true, message: 'Please verify your email to sign in.' });

    const ok = await compare(password, user.hashedPassword);
    if (!ok) return fail(400, { action: 'signin', error: true, message: 'Incorrect email or password.' });

    // Create a session token manually for now
    const sessionToken = randomUUID();
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
    throw redirect(303, user.role === 'admin' ? '/dashboard' : '/user');
  }
  ,
  register: async ({ request }) => {
    try {
      const form = await request.formData();
      const email = String(form.get('email') ?? '').trim().toLowerCase();
      const password = String(form.get('password') ?? '');
      const firstName = String(form.get('firstName') ?? '').trim() || null;
      const lastName = String(form.get('lastName') ?? '').trim() || null;

      if (!email || !password) return fail(400, { action: 'register', error: true, message: 'Email and password are required.' });

      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing) return fail(400, { action: 'register', error: true, message: 'Email already in use.' });

      const hashedPassword = await hash(password, 10);
      const userId = randomUUID();
      await db.insert(users).values({ id: userId, email, hashedPassword, firstName, lastName, name: [firstName, lastName].filter(Boolean).join(' ') || null });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await db.insert(verificationToken).values({ identifier: email, token: otp, expires });
      await sendOtpEmail(email, otp);

      throw redirect(303, `/verify?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('[register] error:', error);
      return fail(500, { action: 'register', error: true, message: 'Something went wrong. Please try again.' });
    }
  }
};