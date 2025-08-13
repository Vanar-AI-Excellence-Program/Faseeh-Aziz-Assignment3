// src/routes/auth/[...path]/+server.ts
import { SvelteKitAuth } from '@auth/sveltekit';
import { authOptions } from '../../../auth';

export const GET = SvelteKitAuth(authOptions);
export const POST = SvelteKitAuth(authOptions);