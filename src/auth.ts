import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';
import GitHub from '@auth/core/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$lib/server/db';
import { user, account, session, verificationToken } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';
import { eq, and } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import type { User, Account, Profile } from '@auth/core/types';

export const authOptions = {
  adapter: DrizzleAdapter(db, { user, account, session, verificationToken } as any),
  trustHost: true,
  secret: env.AUTH_SECRET,
  allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
  session: { 
    strategy: 'database' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: 'authjs.callback-url',
      options: {
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  providers: [
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
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) {
          throw new Error("Email and password required");
        }

        const email = creds.email.toString();
        const password = creds.password.toString();

        // Fetch user from database
        const [u] = await db.select().from(user).where(eq(user.email, email.toLowerCase()));
        if (!u) throw new Error("Invalid credentials");
        if (u.disabled) throw new Error("Account disabled");

        // Check if user has a password (credentials account)
        if (!u.hashedPassword) throw new Error("Invalid credentials");

        const valid = await compare(password, u.hashedPassword);
        if (!valid) throw new Error("Invalid credentials");

        return {
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          image: u.image ?? null,
          role: u.role
        };
      }
    })
  ],
  callbacks: {
    async signIn(params: { user: User; account?: Account | null; profile?: Profile; email?: { verificationRequest?: boolean }; credentials?: Record<string, unknown> }) {
      const { account: authAccount, profile } = params;
      if (!authAccount || authAccount.provider === 'credentials') return true;

      const email = (profile as any)?.email as string | undefined;
      if (!email) return true;

      // Find existing user with the same email
      const [existingUser] = await db.select().from(user).where(eq(user.email, email.toLowerCase()));
      if (!existingUser) return true; // No existing user, allow normal account creation

      // Check if this specific provider is already linked
      const linkedAccounts = await db.select().from(account).where(eq(account.userId, existingUser.id));
      const linkedProviders = linkedAccounts.map((a) => a.provider);

      if (!linkedProviders.includes(authAccount.provider)) {
        // Provider not linked yet, but user exists with same email
        // Allow the sign-in to proceed - Auth.js will automatically link the account
        console.log(`Linking ${authAccount.provider} account to existing user: ${existingUser.email}`);
        return true;
      }

      // Provider already linked, proceed normally
      return true;
    },

    async session({ session, user }: { session: any; user: any }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Handle redirects after authentication
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      
      // Default redirect after OAuth login - use post-auth handler
      return `${baseUrl}/post-auth`;
    }
  },
  pages: { 
    signIn: '/login',
    signOut: '/login',
    error: '/login'
  },
  events: {
    async signIn(params: { user: User; account?: Account | null; profile?: Profile }) {
      const { user: authUser, account: authAccount, profile } = params;
      // Update user profile information when signing in with OAuth
      if (authAccount && profile && authUser && authUser.id) {
        try {
          if (authAccount.provider === 'google') {
            await db
              .update(user)
              .set({
                name: profile.name || authUser.name,
                email: profile.email || authUser.email,
                image: profile.picture || authUser.image
              })
              .where(eq(user.id, authUser.id));
          } else if (authAccount.provider === 'github') {
            await db
              .update(user)
              .set({
                name: profile.name || authUser.name,
                email: profile.email || authUser.email,
                image: profile.avatar_url || authUser.image
              })
              .where(eq(user.id, authUser.id));
          }
        } catch (error) {
          console.error('Error updating user profile:', error);
        }
      }
    },
    async signOut(message: { session: any } | { token: any }) {
      // Clean up any additional data if needed
      console.log('User signed out successfully');
    }
  }
};

export const { handle, signIn, signOut } = SvelteKitAuth(authOptions);