import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, verificationToken, session, pendingUser } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { sendOtpEmail } from '$lib/server/email';

export const load = async ({ url }: any) => {
  const email = String(url.searchParams.get('email') ?? '').trim().toLowerCase();
  if (!email) {
    console.log('[verify] No email provided, redirecting to login');
    throw redirect(303, '/login');
  }

  console.log('[verify] Loading verification page for email:', email);

  // Look up the most recent token (by expiry) to expose countdown to the client
  const [token] = await db
    .select()
    .from(verificationToken)
    .where(eq(verificationToken.identifier, email))
    .orderBy(desc(verificationToken.expires))
    .limit(1);
  
  const sent = url.searchParams.get('sent');
  console.log('[verify] Token found:', !!token, 'sent:', sent);
  
  return { email, expiresAt: token?.expires?.toISOString?.() ?? null, sent: sent === '1' ? 1 : 0 };
};

export const actions = {
  verify: async ({ request, cookies }: any) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const code = String(form.get('code') ?? '').trim();

    console.log('[verify] Attempting verification for email:', email, 'code length:', code.length);

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

    if (!token || token.expires < now) {
      console.log('[verify] Token invalid or expired');
      return fail(400, { error: true, message: 'Invalid or expired code.' });
    }

    console.log('[verify] Token valid, proceeding with user creation/verification');

    // Finalize user creation: move from pending_user to user if not exists
    const [existingUser] = await db.select().from(user).where(eq(user.email, email));
    if (!existingUser) {
      console.log('[verify] No existing user, checking pending user');
      const [pending] = await db.select().from(pendingUser).where(eq(pendingUser.email, email));
      if (!pending) {
        console.log('[verify] No pending user found');
        return fail(400, { message: 'No pending registration found for this email.' });
      }
      
      console.log('[verify] Creating user from pending user');
      const userId = pending.id;
      await db.insert(user).values({
        id: userId,
        email,
        hashedPassword: pending.hashedPassword,
        name: [pending.firstName, pending.lastName].filter(Boolean).join(' ') || null,
        emailVerified: now
      });
      await db.delete(pendingUser).where(eq(pendingUser.email, email));
      console.log('[verify] User created successfully');
    } else {
      console.log('[verify] Existing user found, marking as verified');
      // Existing user path: just mark verified
      await db.update(user).set({ emailVerified: now }).where(eq(user.email, email));
    }
    
    await db.delete(verificationToken).where(eq(verificationToken.identifier, email));
    console.log('[verify] Verification token deleted');

    const [u] = await db.select().from(user).where(eq(user.email, email));
    if (!u) {
      console.error('[verify] User not found after creation/verification');
      throw redirect(303, '/login');
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

  resend: async ({ request }: any) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    if (!email) return fail(400, { message: 'Email is required.' });

    // Remove existing tokens for this email
    await db.delete(verificationToken).where(eq(verificationToken.identifier, email));

    // Generate and store a new 6-digit OTP with 10-minute expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(verificationToken).values({ identifier: email, token: otp, expires });

    await sendOtpEmail(email, otp);

    // Return new expiry so the client can restart the timer without redirect
    return { expiresAt: expires.toISOString() };
  }
};


