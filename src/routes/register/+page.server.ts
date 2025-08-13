import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');

    if (!email || !password) return fail(400, { message: 'Email and password are required.' });

    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) return fail(400, { message: 'Email already in use.' });

    const hashedPassword = await hash(password, 10);
    await db.insert(users).values({ id: randomUUID(), email, hashedPassword });

    throw redirect(303, '/login');
  }
};