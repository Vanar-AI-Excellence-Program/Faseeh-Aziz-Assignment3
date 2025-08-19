import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear all auth-related cookies
	cookies.delete('authjs.session-token', { path: '/' });
	cookies.delete('authjs.csrf-token', { path: '/' });
	cookies.delete('authjs.callback-url', { path: '/' });
	cookies.delete('authjs.pkce.code_verifier', { path: '/' });
	
	// Redirect to homepage
	throw redirect(302, '/');
};

export const GET: RequestHandler = async ({ cookies }) => {
	// Clear all auth-related cookies
	cookies.delete('authjs.session-token', { path: '/' });
	cookies.delete('authjs.csrf-token', { path: '/' });
	cookies.delete('authjs.callback-url', { path: '/' });
	cookies.delete('authjs.pkce.code_verifier', { path: '/' });
	
	throw redirect(302, '/');
};


