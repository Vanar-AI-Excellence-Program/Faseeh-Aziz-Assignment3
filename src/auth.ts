import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/core/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$lib/server/db';
import { users, accounts, sessions, verificationTokens } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';

export const authOptions = {
    adapter: DrizzleAdapter(db),
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

        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user || !user.hashedPassword) return null;

        const ok = await compare(password, user.hashedPassword);
        if (!ok) return null;

        return { id: user.id, name: user.name ?? null, email: user.email ?? null, image: user.image ?? null };
      }
    })
  ],
  pages: { signIn: '/login' }
};

export const { handle, signIn, signOut } = SvelteKitAuth(authOptions);