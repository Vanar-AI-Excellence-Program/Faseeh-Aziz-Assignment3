import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { message, chat } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { id, chatId, parentId, role, content } = body as any;
  if (!id || !chatId || !role || !content) return new Response('Bad Request', { status: 400 });
  await db.insert(message).values({ id, chatId, parentId: parentId ?? null, role, content });
  await db.update(chat).set({ updatedAt: new Date() as any }).where(eq(chat.id, chatId));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};


