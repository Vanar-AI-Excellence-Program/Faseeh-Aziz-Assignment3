import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chat } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = body.id as string;
  const title = (body.title as string) || 'New Chat';
  if (!id) return new Response('Missing id', { status: 400 });
  await db.insert(chat).values({ id, userId: session.user.id, title }).onConflictDoNothing?.();
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};


