import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chat } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
  const body = await request.json();
  const { id } = body as any;
  if (!id) return new Response('Bad Request', { status: 400 });
  await db.delete(chat).where(eq(chat.id, id));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};


