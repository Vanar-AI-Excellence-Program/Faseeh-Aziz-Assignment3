import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, verificationToken, session } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { sendOtpEmail } from '$lib/server/email';

export const load = async ({ url }: any) => {
  const email = String(url.searchParams.get('email') ?? '').trim().toLowerCase();
  if (!email) {
    throw redirect(303, '/register');
  }

  // Look up the most recent token (by expiry) to expose countdown to the client
  const [token] = await db
    .select()
    .from(verificationToken)
    .where(eq(verificationToken.identifier, email))
    .orderBy(desc(verificationToken.expires))
    .limit(1);
  return { email, expiresAt: token?.expires?.toISOString?.() ?? null };
};

export const actions = {
  verify: async ({ request, cookies }: any) => {
    try {
      const form = await request.formData();
      const email = String(form.get('email') ?? '').trim().toLowerCase();
      const code = String(form.get('code') ?? '').trim();

      if (!email || !code) return fail(400, { message: 'Email and code are required.' });

      const now = new Date();
      const [token] = await db
        .select()
        .from(verificationToken)
        .where(and(eq(verificationToken.identifier, email), eq(verificationToken.token, code)));

      if (!token || token.expires < now) {
        return fail(400, { message: 'Invalid or expired code.' });
      }

      await db.update(users).set({ emailVerified: now }).where(eq(users.email, email));
      await db.delete(verificationToken).where(eq(verificationToken.identifier, email));

      // Auto-login: create a session and redirect to dashboard
      const [u] = await db.select().from(users).where(eq(users.email, email));
      if (!u) throw redirect(303, '/login');

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
      throw redirect(303, `/verify/success?dest=${encodeURIComponent(dest)}`);
    } catch (error) {
      // Re-throw redirects and other framework errors to allow proper handling
      throw error;
    }
  },

  resend: async ({ request }: any) => {
    try {
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
    } catch (error) {
      throw error;
    }
  }
};


