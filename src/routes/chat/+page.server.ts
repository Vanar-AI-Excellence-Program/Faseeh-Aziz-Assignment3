import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chat, message } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw redirect(303, '/login');

  const userId = session.user.id;
  const chatsData = await db.select().from(chat).where(eq(chat.userId, userId)).orderBy(chat.updatedAt as any);
  const firstChatId = chatsData[0]?.id ?? null;
  const messagesData = firstChatId
    ? await db.select().from(message).where(and(eq(message.chatId, firstChatId)) as any)
    : [];

  return { 
    user: { id: userId, name: session.user.name, email: session.user.email },
    chats: chatsData,
    messages: messagesData
  } as any;
};
