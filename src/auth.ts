import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';
import GitHub from '@auth/core/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$lib/server/db';
import { user, account, session, verificationToken } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';

export const authOptions = {
  adapter: DrizzleAdapter(db, { user, account, session, verificationToken } as any),
  trustHost: true,
  secret: env.AUTH_SECRET,
  session: { strategy: 'database' as const },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.toString() ?? '';
        const password = credentials?.password?.toString() ?? '';
        if (!email || !password) return null;

        const [u] = await db.select().from(user).where(eq(user.email, email));
        if (!u || !u.hashedPassword) return null;
        if (u.disabled) return null;

        const ok = await compare(password, u.hashedPassword);
        if (!ok) return null;

        return { 
          id: u.id, 
          name: u.name ?? null, 
          email: u.email ?? null, 
          image: u.image ?? null,
          role: u.role 
        };
      }
    }),
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: 'select_account'
        }
      }
    }),
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET
    })
  ],
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    }
  },
  pages: { signIn: '/login' }
};

export const { handle, signIn, signOut } = SvelteKitAuth(authOptions);