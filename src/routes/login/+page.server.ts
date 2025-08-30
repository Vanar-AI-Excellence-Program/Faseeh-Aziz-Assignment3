import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user, session as sessionTable, verificationToken } from '$lib/server/db/schema';
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
    } else if (error === 'disabled') {
      message = url.searchParams.get('message') || 'Account is disabled. Please contact an administrator.';
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

    const [userRecord] = await db.select().from(user).where(eq(user.email, email));
    if (!userRecord || !userRecord.hashedPassword) return fail(400, { action: 'signin', error: true, message: 'Incorrect email or password.' });
    
    // Check if user is disabled FIRST - before any other checks
    if (userRecord.disabled) return fail(403, { action: 'signin', error: true, message: 'Account is disabled. Please contact an administrator.' });
    
    // Check if email is verified - if not, redirect to verification page
    if (!userRecord.emailVerified) {
      // Check for existing token and generate a new one if needed
      let [existingToken] = await db.select().from(verificationToken).where(eq(verificationToken.identifier, email));
      
      // If no token exists or token is expired, generate a new one
      if (!existingToken || (existingToken.expires && existingToken.expires < new Date())) {
        // Remove old token if it exists
        if (existingToken) {
          await db.delete(verificationToken).where(eq(verificationToken.identifier, email));
        }
        
        // Generate and store a new 6-digit OTP with 10-minute expiry
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        await db.insert(verificationToken).values({ identifier: email, token: otp, expires });
        
        // Try sending email, but don't block the flow if it fails
        try {
          await sendOtpEmail(email, otp);
        } catch (e) {
          // Failed to send verification email - continue without blocking
        }
      }
      
      // Redirect to verification page
      throw redirect(303, `/verify?email=${encodeURIComponent(email)}&sent=1`);
    }

    const ok = await compare(password, userRecord.hashedPassword);
    if (!ok) return fail(400, { action: 'signin', error: true, message: 'Incorrect email or password.' });

    // Create a session token manually for now
    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Insert session into database
    await db.insert(sessionTable).values({
      sessionToken,
      userId: userRecord.id,
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
    throw redirect(303, userRecord.role === 'admin' ? '/dashboard' : '/user');
  },
  register: async ({ request }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '').trim();
    const name = String(form.get('name') ?? '').trim() || null;

    if (!email || !password) {
      return fail(400, { action: 'register', error: true, message: 'Email and password are required.' });
    }

    try {
      const [existing] = await db.select().from(user).where(eq(user.email, email));
      if (existing) {
        return fail(400, { action: 'register', error: true, message: 'Email already in use.' });
      }
    } catch (checkError) {
      // console.error('[register] Failed to check existing user:', checkError); // Removed sensitive logging
      return fail(500, { action: 'register', error: true, message: 'Failed to check existing user. Please try again.' });
    }

    const hashedPassword = await hash(password, 10);
    const userId = randomUUID();
    
    try {
      // Create user directly since we have email verification column
      await db.insert(user).values({ id: userId, email, hashedPassword, name });
    } catch (insertError) {
      // console.error('[register] Failed to create user:', insertError); // Removed sensitive logging
      return fail(500, { action: 'register', error: true, message: 'Failed to create user. Please try again.' });
    }

    // Upsert verification token (clear old ones first to avoid conflicts)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    
    try {
      await db.delete(verificationToken).where(eq(verificationToken.identifier, email));
    } catch (e) {
      // Ignore errors when clearing old tokens
    }
    
    try {
      await db.insert(verificationToken).values({ identifier: email, token: otp, expires });
    } catch (tokenError) {
      // console.error('[register] Failed to create verification token:', tokenError); // Removed sensitive logging
      return fail(500, { action: 'register', error: true, message: 'Failed to create verification token. Please try again.' });
    }

    // Try sending email, but do not block the flow if SMTP fails
    let sent = 1;
    try {
      await sendOtpEmail(email, otp);
    } catch (e) {
      // console.error('[register] sendOtpEmail failed:', e); // Removed sensitive logging
      sent = 0;
    }

    const dest = `/verify?email=${encodeURIComponent(email)}&sent=${sent}`;
    throw redirect(303, dest);
  }
};