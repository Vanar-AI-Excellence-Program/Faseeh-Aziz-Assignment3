import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');

    if (!email || !password) return fail(400, { message: 'Email and password are required.' });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !user.hashedPassword) return fail(400, { message: 'Invalid credentials.' });

    const ok = await compare(password, user.hashedPassword);
    if (!ok) return fail(400, { message: 'Invalid credentials.' });

    // Create DB session and set cookie compatible with Auth.js database strategy
    const token = randomBytes(32).toString('hex');
    const maxAgeDays = 30;
    const expires = new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({ sessionToken: token, userId: user.id, expires });

    cookies.set('authjs.session-token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires
    });

    throw redirect(303, '/dashboard');
  }
};