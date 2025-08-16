import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import { signIn } from '../../auth';

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');

    if (!email || !password) return fail(400, { message: 'Email and password are required.' });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !user.hashedPassword) return fail(400, { message: 'Invalid credentials.' });
    if (user.disabled) return fail(403, { message: 'Account is disabled.' });

    const ok = await compare(password, user.hashedPassword);
    if (!ok) return fail(400, { message: 'Invalid credentials.' });

    // Use Auth.js signIn for credentials
    return await signIn('credentials', {
      email,
      password,
      redirect: false
    });
  }
};