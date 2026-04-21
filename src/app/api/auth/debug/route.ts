import { NextResponse } from 'next/server';

// Safe diagnostic endpoint. Does NOT expose secrets.
// Use it to confirm the running build has picked up the env vars.
export async function GET() {
  return NextResponse.json({
    build: 'env-auth-v1',
    nodeEnv: process.env.NODE_ENV || null,
    adminEmailConfigured: !!process.env.ADMIN_EMAIL,
    adminPasswordConfigured: !!process.env.ADMIN_PASSWORD,
    adminNameConfigured: !!process.env.ADMIN_NAME,
    mongoConfigured: !!process.env.MONGODB_URI,
    jwtConfigured: !!process.env.JWT_SECRET,
    // Return only the first and last char of the email to help the user
    // confirm the value without leaking it.
    adminEmailHint: process.env.ADMIN_EMAIL
      ? `${process.env.ADMIN_EMAIL[0]}***${process.env.ADMIN_EMAIL.slice(-1)}`
      : null,
    adminPasswordLength: process.env.ADMIN_PASSWORD?.length ?? 0,
  });
}
