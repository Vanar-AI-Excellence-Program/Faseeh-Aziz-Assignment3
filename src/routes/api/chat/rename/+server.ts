import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chat } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const id: string | undefined = body?.id;
    const titleRaw: string | undefined = body?.title;
    const title = (titleRaw ?? '').trim();

    if (!id || !title) {
      return new Response(JSON.stringify({ error: 'Missing id or title' }), { status: 400 });
    }

    await db
      .update(chat)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(chat.id, id), eq(chat.userId, session.user.id)));

    return new Response(JSON.stringify({ ok: true, id, title }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'Failed to rename chat' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};


