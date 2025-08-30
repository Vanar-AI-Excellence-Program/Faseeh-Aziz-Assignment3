import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, verificationToken } from '$lib/server/db/schema';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { sendOtpEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  
  // If user is already authenticated, redirect to appropriate page
  if (session?.user) {
    const role = (session.user as any).role || 'user';
    const dest = role === 'admin' ? '/dashboard' : '/user';
    throw redirect(303, dest);
  }
};

export const actions: Actions = {
  register: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validation
    if (!name || !email || !password) {
      return fail(400, {
        error: 'Missing required fields',
        message: 'Please fill in all required fields'
      });
    }

    if (password.length < 8) {
      return fail(400, {
        error: 'Password too short',
        message: 'Password must be at least 8 characters long'
      });
    }

    try {
      // Check if user already exists
      const [existingUser] = await db.select().from(user).where(eq(user.email, email.toLowerCase()));
      
      if (existingUser) {
        return fail(400, {
          error: 'User exists',
          message: 'An account with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await hash(password, 12);

      // Create new user
      const newUser = {
        id: randomUUID(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        hashedPassword,
        role: 'user',
        isActive: true,
        disabled: false
      };

      await db.insert(user).values(newUser);

      // Create verification token
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Clear any existing tokens for this email
      await db.delete(verificationToken).where(eq(verificationToken.identifier, email.toLowerCase()));
      
      // Insert new verification token
      await db.insert(verificationToken).values({
        identifier: email.toLowerCase(),
        token: otp,
        expires
      });

      // Send verification email
      try {
        await sendOtpEmail(email, otp);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the registration if email fails
      }

      // Redirect to verification page
      throw redirect(303, `/verify?email=${encodeURIComponent(email)}&sent=1`);

    } catch (error) {
      console.error('Registration error:', error);
      return fail(500, {
        error: 'Registration failed',
        message: 'An error occurred during registration. Please try again.'
      });
    }
  }
};
