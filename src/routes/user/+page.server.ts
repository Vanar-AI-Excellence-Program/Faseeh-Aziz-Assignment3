import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user, session, chat, message } from '$lib/server/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  // Try Auth.js session first
  try {
    const authSession = await locals.auth();
    if (authSession?.user?.id) {
      // Always fetch fresh user data from database to get latest role
      const [userData] = await db.select().from(user).where(eq(user.id, authSession.user.id));
      if (!userData || userData.disabled) throw redirect(303, '/login');
      
      // Redirect admin users to dashboard immediately
      if (userData.role === 'admin') {
        throw redirect(303, '/dashboard');
      }

      // Fetch user statistics and recent activity
      const [chatCount] = await db.select({ count: count() }).from(chat).where(eq(chat.userId, userData.id));
      
      // Get total messages for all chats of this user
      const userChats = await db.select({ id: chat.id }).from(chat).where(eq(chat.userId, userData.id));
      const chatIds = userChats.map(c => c.id);
      const messageCount = chatIds.length > 0 
        ? await db.select({ count: count() }).from(message).where(sql`${message.chatId} IN (${sql.join(chatIds, sql`, `)})`)
        : [{ count: 0 }];
      
      // Get recent chats
      const recentChats = await db.select({
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt
      })
      .from(chat)
      .where(eq(chat.userId, userData.id))
      .orderBy(desc(chat.updatedAt))
      .limit(5);

      return { 
        user: { 
          id: userData.id,
          email: userData.email, 
          name: userData.name, 
          role: userData.role,
          emailVerified: userData.emailVerified
        },
        stats: {
          totalChats: chatCount?.count || 0,
          totalMessages: messageCount[0]?.count || 0
        },
        recentChats
      };
    }
  } catch (error) {
    // Auth.js session failed, try manual session
  }

  // Fallback to manual session check
  const sessionToken = cookies.get('authjs.session-token');
  if (!sessionToken) throw redirect(303, '/login');

  const [sessionData] = await db.select().from(session).where(eq(session.sessionToken, sessionToken));
  if (!sessionData || sessionData.expires <= new Date()) throw redirect(303, '/login');

  const [userData] = await db.select().from(user).where(eq(user.id, sessionData.userId));
  if (!userData || userData.disabled) throw redirect(303, '/login');
  
  // Redirect admin users to dashboard immediately
  if (userData.role === 'admin') {
    throw redirect(303, '/dashboard');
  }

  // Fetch user statistics and recent activity
  const [chatCount] = await db.select({ count: count() }).from(chat).where(eq(chat.userId, userData.id));
  
  // Get total messages for all chats of this user
  const userChats = await db.select({ id: chat.id }).from(chat).where(eq(chat.userId, userData.id));
  const chatIds = userChats.map(c => c.id);
  const messageCount = chatIds.length > 0 
    ? await db.select({ count: count() }).from(message).where(sql`${message.chatId} IN (${sql.join(chatIds, sql`, `)})`)
    : [{ count: 0 }];
  
  // Get recent chats
  const recentChats = await db.select({
    id: chat.id,
    title: chat.title,
    updatedAt: chat.updatedAt
  })
  .from(chat)
  .where(eq(chat.userId, userData.id))
  .orderBy(desc(chat.updatedAt))
  .limit(5);

  return { 
    user: { 
      id: userData.id,
      email: userData.email, 
      name: userData.name, 
      role: userData.role,
      emailVerified: userData.emailVerified
    },
    stats: {
      totalChats: chatCount?.count || 0,
      totalMessages: messageCount[0]?.count || 0
    },
    recentChats
  };
};


