import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user, session as sessionTable, verificationToken } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { sendOtpEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ url, locals }) => {
  // Test database connection
  try {
    console.log('[login] Testing database connection...');
    const testResult = await db.select().from(user).limit(1);
    console.log('[login] Database connection successful, user count:', testResult.length);
  } catch (error) {
    console.error('[login] Database connection failed:', error);
  }

  // Check if user is already authenticated
  const session = await locals.auth();
  if (session?.user) {
    const dest = (session.user as any).role === 'admin' ? '/dashboard' : '/user';
    throw redirect(303, dest);
  }

  // Handle Auth.js errors explicitly (e.g., OAuthAccountNotLinked)
  const error = url.searchParams.get('error');
  console.log('[login] Server load - URL error param:', error);
  console.log('[login] Server load - URL message param:', url.searchParams.get('message'));
  
  if (error) {
    let message = 'An error occurred during sign in. Please try again.';
    if (error === 'OAuthAccountNotLinked') {
      message = 'Another account already exists with the same email. Please sign in using your original method (e.g., Credentials)';
    } else if (error === 'OAuthAccountExists') {
      message = 'This email is already associated with a different provider.';
    } else if (error === 'disabled') {
      message = url.searchParams.get('message') || 'Account is disabled. Please contact an administrator.';
    }
    console.log('[login] Server load - Returning error:', { type: 'auth_error', message, provider: null });
    return { error: { type: 'auth_error', message, provider: null } };
  }
  
  return {};
};

export const actions: Actions = {
  signin: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');

    if (!email || !password) return fail(400, { action: 'signin', error: true, message: 'Email and password are required.' });

    const [userRecord] = await db.select().from(user).where(eq(user.email, email));
    if (!userRecord || !userRecord.hashedPassword) return fail(400, { action: 'signin', error: true, message: 'Incorrect email or password.' });
    
    // Check if user is disabled FIRST - before any other checks
    if (userRecord.disabled) return fail(403, { action: 'signin', error: true, message: 'Account is disabled. Please contact an administrator.' });
    
    // Check if email is verified - if not, redirect to verification page
    if (!userRecord.emailVerified) {
      console.log('[signin] User email not verified, redirecting to verification page:', email);
      
      // Check for existing token and generate a new one if needed
      let [existingToken] = await db.select().from(verificationToken).where(eq(verificationToken.identifier, email));
      
      // If no token exists or token is expired, generate a new one
      if (!existingToken || (existingToken.expires && existingToken.expires < new Date())) {
        console.log('[signin] Generating new verification token for:', email);
        
        // Remove old token if it exists
        if (existingToken) {
          await db.delete(verificationToken).where(eq(verificationToken.identifier, email));
        }
        
        // Generate and store a new 6-digit OTP with 10-minute expiry
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        await db.insert(verificationToken).values({ identifier: email, token: otp, expires });
        
        // Try sending email, but don't block the flow if it fails
        try {
          await sendOtpEmail(email, otp);
          console.log('[signin] Verification email sent successfully to:', email);
        } catch (e) {
          console.error('[signin] Failed to send verification email:', e);
        }
      } else {
        console.log('[signin] Using existing verification token for:', email);
      }
      
      // Redirect to verification page
      console.log('[signin] Redirecting to verification page for:', email);
      throw redirect(303, `/verify?email=${encodeURIComponent(email)}&sent=1`);
    }

    const ok = await compare(password, userRecord.hashedPassword);
    if (!ok) return fail(400, { action: 'signin', error: true, message: 'Incorrect email or password.' });

    // Create a session token manually for now
    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Insert session into database
    await db.insert(sessionTable).values({
      sessionToken,
      userId: userRecord.id,
      expires
    });

    // Set the session cookie
    cookies.set('authjs.session-token', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires
    });

    // Redirect based on user role
    throw redirect(303, userRecord.role === 'admin' ? '/dashboard' : '/user');
  }
  ,
  register: async ({ request }) => {
    console.log('[register] Registration action called');
    
    // Test database connection first
    try {
      console.log('[register] Testing database connection...');
      const testResult = await db.select().from(user).limit(1);
      console.log('[register] Database connection successful, user count:', testResult.length);
    } catch (dbError) {
      console.error('[register] Database connection failed:', dbError);
      return fail(500, { action: 'register', error: true, message: 'Database connection failed. Please try again.' });
    }

    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '').trim();
    const name = String(form.get('name') ?? '').trim() || null;

    console.log('[register] Form data received:', { email, name, hasPassword: !!password });

    if (!email || !password) {
      console.log('[register] Missing email or password');
      return fail(400, { action: 'register', error: true, message: 'Email and password are required.' });
    }

    console.log('[register] Checking for existing user');
    try {
      const [existing] = await db.select().from(user).where(eq(user.email, email));
      if (existing) {
        console.log('[register] Email already exists');
        return fail(400, { action: 'register', error: true, message: 'Email already in use.' });
      }
    } catch (checkError) {
      console.error('[register] Failed to check existing user:', checkError);
      return fail(500, { action: 'register', error: true, message: 'Failed to check existing user. Please try again.' });
    }

    console.log('[register] Hashing password');
    const hashedPassword = await hash(password, 10);
    const userId = randomUUID();
    
    console.log('[register] Creating user with ID:', userId);
    
    try {
      // Create user directly since we have email verification column
      await db.insert(user).values({ id: userId, email, hashedPassword, name });
      console.log('[register] User created successfully');
    } catch (insertError) {
      console.error('[register] Failed to create user:', insertError);
      return fail(500, { action: 'register', error: true, message: 'Failed to create user. Please try again.' });
    }

    // Upsert verification token (clear old ones first to avoid conflicts)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    
    console.log('[register] Generated OTP:', otp, 'expires:', expires);
    
    try {
      await db.delete(verificationToken).where(eq(verificationToken.identifier, email));
      console.log('[register] Old verification tokens cleared');
    } catch (e) {
      console.log('[register] No old tokens to clear');
    }
    
    try {
      await db.insert(verificationToken).values({ identifier: email, token: otp, expires });
      console.log('[register] Verification token created');
    } catch (tokenError) {
      console.error('[register] Failed to create verification token:', tokenError);
      return fail(500, { action: 'register', error: true, message: 'Failed to create verification token. Please try again.' });
    }

    // Try sending email, but do not block the flow if SMTP fails
    let sent = 1;
    try {
      await sendOtpEmail(email, otp);
      console.log('[register] Email sent successfully');
    } catch (e) {
      console.error('[register] sendOtpEmail failed:', e);
      sent = 0;
    }

    console.log('[register] About to redirect...');
    const dest = `/verify?email=${encodeURIComponent(email)}&sent=${sent}`;
    console.log('[register] Redirecting to:', dest);
    
    // Always redirect, don't check for JSON accept header
    console.log('[register] Redirecting with 303');
    console.log('[register] Final redirect destination:', dest);
    throw redirect(303, dest);
  }
};