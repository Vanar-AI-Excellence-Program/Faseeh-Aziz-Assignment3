import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user, verificationToken } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { hash } from 'bcryptjs';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	const email = url.searchParams.get('email') ?? '';
	return { token, email };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const token = String(form.get('token') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		if (!email || !token || !password) return fail(400, { message: 'All fields are required.' });
		if (password !== confirm) return fail(400, { message: 'Passwords do not match.' });
		if (password.length < 8) return fail(400, { message: 'Password must be at least 8 characters long.' });

		const now = new Date();
		const [tok] = await db
			.select()
			.from(verificationToken)
			.where(and(eq(verificationToken.identifier, email), eq(verificationToken.token, token)));

		if (!tok || tok.expires < now) {
			return fail(400, { message: 'Invalid or expired reset link.' });
		}

		const hashedPassword = await hash(password, 10);
		await db.update(user).set({ hashedPassword }).where(eq(user.email, email));
		await db.delete(verificationToken).where(and(eq(verificationToken.identifier, email), eq(verificationToken.token, token)));

		throw redirect(303, '/login');
	}
};


