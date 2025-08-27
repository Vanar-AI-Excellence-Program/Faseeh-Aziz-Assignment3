import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.SMTP_FROM || `no-reply@${new URL(verificationUrl).hostname}`;

  if (!host || !port || !user || !pass) {
    console.warn('[email] SMTP not configured. Verification link:', verificationUrl);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
      <h2>Verify your email</h2>
      <p>Thanks for signing up. Please confirm your email address by clicking the button below:</p>
      <p>
        <a href="${verificationUrl}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Verify Email</a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    </div>
  `;

  await transporter.sendMail({
    to,
    from,
    subject: 'Verify your email',
    html
  });
}

export async function sendOtpEmail(to: string, code: string) {
  // Always log the code in development to ease testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[email][dev] OTP for ${to}: ${code}`);
  }
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.SMTP_FROM || 'no-reply@example.com';

  if (!host || !port || !user || !pass) {
    console.warn('[email] SMTP not configured. Verification code:', code);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
      <h2>Your verification code</h2>
      <p>Enter the following 6-digit code to verify your email address:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${code}</p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  await transporter.sendMail({
    to,
    from,
    subject: 'Your verification code',
    html
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.SMTP_FROM || `no-reply@${new URL(resetUrl).hostname}`;

  if (!host || !port || !user || !pass) {
    console.warn('[email] SMTP not configured. Password reset link:', resetUrl);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
      <h2>Reset your password</h2>
      <p>We received a request to reset your password. Click the button below to choose a new one. If you didn't request this, you can safely ignore this email.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Reset Password</a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p style="color:#6b7280; font-size:12px;">This link will expire soon for your security.</p>
    </div>
  `;

  await transporter.sendMail({
    to,
    from,
    subject: 'Reset your password',
    html
  });
}

export async function sendPasswordResetCodeEmail(to: string, code: string) {
  // Log code in development for easier manual testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[email][dev] PASSWORD RESET CODE for ${to}: ${code}`);
  }
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.SMTP_FROM || 'no-reply@example.com';

  if (!host || !port || !user || !pass) {
    console.warn('[email] SMTP not configured. Password reset code:', code);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
      <h2>Confirm your password reset</h2>
      <p>Use the following 6-digit code to reset your password. If you didn't request this, you can ignore this email.</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${code}</p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  await transporter.sendMail({
    to,
    from,
    subject: 'Your password reset code',
    html
  });
}


