import { NextResponse } from 'next/server';
import { getAdminFromToken } from '@/lib/auth';

export async function GET() {
  const admin = await getAdminFromToken();
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, admin });
}
