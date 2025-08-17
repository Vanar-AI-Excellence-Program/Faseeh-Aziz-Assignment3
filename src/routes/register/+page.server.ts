import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users, verificationToken } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import { sendOtpEmail } from '$lib/server/email';

export const actions: Actions = {
  default: async ({ request }) => {
    try {
      const form = await request.formData();
      const email = String(form.get('email') ?? '').trim().toLowerCase();
      const password = String(form.get('password') ?? '');
      const firstName = String(form.get('firstName') ?? '').trim() || null;
      const lastName = String(form.get('lastName') ?? '').trim() || null;

      if (!email || !password) return fail(400, { message: 'Email and password are required.' });

      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing) return fail(400, { message: 'Email already in use.' });

      const hashedPassword = await hash(password, 10);
      const userId = randomUUID();
      await db.insert(users).values({ id: userId, email, hashedPassword, firstName, lastName, name: [firstName, lastName].filter(Boolean).join(' ') || null });
      console.log('[register] user created:', email);

      // Generate a 6-digit OTP and send email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await db.insert(verificationToken).values({ identifier: email, token: otp, expires });
      console.log('[register] otp created for', email, 'expires at', expires.toISOString());

      await sendOtpEmail(email, otp);
      console.log('[register] otp sent to', email);

      throw redirect(303, `/verify?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('[register] error:', error);
      throw error;
    }
  }
};