import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users, verificationToken, session } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { sendPasswordResetCodeEmail } from '$lib/server/email';

export const actions: Actions = {
	// Step 1: Request OTP
	request: async ({ request }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		if (!email) return fail(400, { message: 'Email is required.' });

		try {
			const [existing] = await db.select().from(users).where(eq(users.email, email));
			if (existing) {
				const code = Math.floor(100000 + Math.random() * 900000).toString();
				const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
				await db.insert(verificationToken).values({ identifier: email, token: code, expires });
				await sendPasswordResetCodeEmail(email, code);
			}
		} catch (error) {
			console.error('[forgot-password][request] error:', error);
		}

		// Move to OTP step regardless to avoid enumeration
		return { step: 'verify', email } as any;
	},

	// Step 2: Verify OTP
	verify: async ({ request }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const code = String(form.get('code') ?? '').trim();
		if (!email || !code) return fail(400, { message: 'Email and code are required.', step: 'verify', email });

		const now = new Date();
		const [token] = await db
			.select()
			.from(verificationToken)
			.where(and(eq(verificationToken.identifier, email), eq(verificationToken.token, code)));

		if (!token || token.expires < now) {
			return fail(400, { message: 'Invalid or expired code.', step: 'verify', email });
		}

		return { step: 'reset', email, code } as any;
	},

	// Step 3: Reset password, create session, redirect
	reset: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const code = String(form.get('code') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		if (!email || !code || !password) return fail(400, { message: 'All fields are required.', step: 'reset', email, code });
		if (password !== confirm) return fail(400, { message: 'Passwords do not match.', step: 'reset', email, code });
		if (password.length < 8) return fail(400, { message: 'Password must be at least 8 characters long.', step: 'reset', email, code });

		const now = new Date();
		const [token] = await db
			.select()
			.from(verificationToken)
			.where(and(eq(verificationToken.identifier, email), eq(verificationToken.token, code)));
		if (!token || token.expires < now) {
			return fail(400, { message: 'Invalid or expired code.', step: 'verify', email });
		}

		const hashedPassword = await hash(password, 10);
		const [u] = await db.select().from(users).where(eq(users.email, email));
		if (!u) return fail(400, { message: 'Invalid request.', step: 'verify', email });

		await db.update(users).set({ hashedPassword }).where(eq(users.id, u.id));
		await db.delete(verificationToken).where(eq(verificationToken.identifier, email));

		// Create session and set cookie
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
		throw redirect(303, dest);
	}
};


