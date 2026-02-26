import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'areej-jwt-secret-2024';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('worker_token')?.value;
    if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; role: string; pageAccess: string[] };
    if (payload.role !== 'worker') return NextResponse.json({ authenticated: false }, { status: 401 });

    return NextResponse.json({ authenticated: true, worker: payload });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
