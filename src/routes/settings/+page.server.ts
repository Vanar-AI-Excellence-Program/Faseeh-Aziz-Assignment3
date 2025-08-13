import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { compare, hash } from 'bcryptjs';

async function requireUser(cookies: import('@sveltejs/kit').Cookies) {
  const token = cookies.get('authjs.session-token');
  if (!token) throw redirect(303, '/login');
  const [session] = await db.select().from(sessions).where(eq(sessions.sessionToken, token));
  if (!session) throw redirect(303, '/login');
  const [me] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!me || me.disabled) throw redirect(303, '/login');
  return me;
}

export const load: PageServerLoad = async ({ cookies }) => {
  const me = await requireUser(cookies);
  return { me: { id: me.id, email: me.email, name: me.name, firstName: me.firstName ?? null, lastName: me.lastName ?? null } };
};

export const actions: Actions = {
  update: async ({ request, cookies }) => {
    const me = await requireUser(cookies);
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim() || null;
    const firstName = String(form.get('firstName') ?? '').trim() || null;
    const lastName = String(form.get('lastName') ?? '').trim() || null;
    const computedName = name || [firstName, lastName].filter(Boolean).join(' ') || null;
    await db.update(users).set({ name: computedName, firstName, lastName }).where(eq(users.id, me.id));
    return { ok: true };
  },
  password: async ({ request, cookies }) => {
    const me = await requireUser(cookies);
    const form = await request.formData();
    const current = String(form.get('current') ?? '');
    const next = String(form.get('next') ?? '');
    const confirm = String(form.get('confirm') ?? '');

    if (!current || !next || !confirm) return fail(400, { message: 'All fields are required.' });
    if (next !== confirm) return fail(400, { message: 'Passwords do not match.' });
    if (next.length < 8) return fail(400, { message: 'Password must be at least 8 characters.' });

    // Re-read user to get hashedPassword
    const [user] = await db.select().from(users).where(eq(users.id, me.id));
    if (!user?.hashedPassword) return fail(400, { message: 'No password set.' });
    const ok = await compare(current, user.hashedPassword);
    if (!ok) return fail(400, { message: 'Current password is incorrect.' });

    const hashedPassword = await hash(next, 10);
    await db.update(users).set({ hashedPassword }).where(eq(users.id, me.id));
    return { ok: true };
  }
};


