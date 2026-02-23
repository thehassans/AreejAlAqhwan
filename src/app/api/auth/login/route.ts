import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    const token = signToken({ id: admin._id.toString(), email: admin.email, name: admin.name });

    const response = NextResponse.json({ success: true, admin: { name: admin.name, email: admin.email } });
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 });
  }
}
