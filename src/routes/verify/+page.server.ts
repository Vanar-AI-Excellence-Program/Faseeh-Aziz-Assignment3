import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user, session, verificationToken } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { sendOtpEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ url, cookies }) => {
  const email = url.searchParams.get('email');
  const sent = url.searchParams.get('sent');
  const error = url.searchParams.get('error');
  
  if (!email) {
    throw redirect(303, '/login');
  }

  // ONLY redirect if user is already verified
  // For ALL other cases, allow them to stay on verification page
  try {
    const [userRecord] = await db.select().from(user).where(eq(user.email, email));
    
    if (userRecord?.emailVerified) {
      // User is already verified, redirect to appropriate page
      const dest = userRecord.role === 'admin' ? '/dashboard' : '/user';
      throw redirect(303, dest);
    }
  } catch (error) {
    // If there's any database error, don't redirect - let user stay on verification page
    console.log('[verify] Database error in load function, allowing user to stay on page:', error);
  }

  // For all other cases (user not verified, user doesn't exist, database errors, etc.), 
  // allow user to stay on verification page
  let token = null;
  try {
    const [tokenResult] = await db
      .select()
      .from(verificationToken)
      .where(eq(verificationToken.identifier, email))
      .orderBy(desc(verificationToken.expires))
      .limit(1);
    token = tokenResult;
  } catch (error) {
    // If there's any database error with token lookup, don't redirect
    console.log('[verify] Token lookup error in load function, allowing user to stay on page:', error);
  }

  return {
    email,
    expiresAt: token?.expires?.toISOString() ?? null,
    sent: sent === '1' ? 1 : 0
  };
};

export const actions = {
  verify: async ({ request, cookies, url }: { request: Request; cookies: any; url: URL }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const code = String(form.get('code') ?? '').trim();

    if (!email || !code) {
      console.log('[verify] Missing email or code');
      return fail(400, { message: 'Email and code are required.' });
    }

    const now = new Date();
    console.log('[verify] Looking up token for email:', email, 'code:', code);
    
    const [token] = await db
      .select()
      .from(verificationToken)
      .where(and(eq(verificationToken.identifier, email), eq(verificationToken.token, code)));

    console.log('[verify] Token found:', !!token, 'expires:', token?.expires, 'now:', now);

    if (!token) {
      console.log('[verify] Token not found');
      return fail(400, { error: true, message: 'Invalid verification code. Please check your code and try again.' });
    }

    if (token.expires < now) {
      console.log('[verify] Token expired');
      return fail(400, { error: true, message: 'Verification code has expired. Please request a new code.' });
    }

    console.log('[verify] Token valid, proceeding with user verification');

    // Mark user as verified
    const [existingUser] = await db.select().from(user).where(eq(user.email, email));
    if (!existingUser) {
      console.log('[verify] No user found');
      return fail(400, { error: true, message: 'No user found for this email. Please complete your registration first.' });
    }
    
    console.log('[verify] Marking user as verified');
    await db.update(user).set({ emailVerified: now }).where(eq(user.email, email));
    console.log('[verify] User verified successfully');
    
    await db.delete(verificationToken).where(eq(verificationToken.identifier, email));
    console.log('[verify] Verification token deleted');

    const [u] = await db.select().from(user).where(eq(user.email, email));
    if (!u) {
      console.error('[verify] User not found after verification');
      return fail(500, { error: true, message: 'An error occurred during verification. Please try again.' });
    }

    console.log('[verify] Creating session for user:', u.id);
    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(session).values({ sessionToken, userId: u.id, expires });
    cookies.set('authjs.session-token', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires
    });

    const dest = u.role === 'admin' ? '/dashboard' : '/user';
    console.log('[verify] Redirecting to:', dest);
    console.log('[verify] About to throw redirect to:', `/verify/success?dest=${encodeURIComponent(dest)}`);
    console.log('[verify] This should not be caught as an error');
    throw redirect(303, `/verify/success?dest=${encodeURIComponent(dest)}`);
  },

  resend: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    if (!email) return fail(400, { error: true, message: 'Email is required.' });

    try {
      // Remove existing tokens for this email
      await db.delete(verificationToken).where(eq(verificationToken.identifier, email));

      // Generate and store a new 6-digit OTP with 10-minute expiry
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await db.insert(verificationToken).values({ identifier: email, token: otp, expires });

      await sendOtpEmail(email, otp);

      // Return new expiry so the client can restart the timer without redirect
      return { expiresAt: expires.toISOString() };
    } catch (error) {
      console.error('[resend] Failed to resend code:', error);
      return fail(500, { error: true, message: 'Failed to resend verification code. Please try again.' });
    }
  }
};


