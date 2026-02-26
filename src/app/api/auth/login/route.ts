import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Worker from '@/models/Worker';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    // Try admin first
    const admin = await Admin.findOne({ email });
    if (admin) {
      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
      }
      const token = signToken({ id: admin._id.toString(), email: admin.email, name: admin.name, role: 'admin' });
      const response = NextResponse.json({ success: true, admin: { name: admin.name, email: admin.email, role: 'admin' } });
      response.cookies.set('admin_token', token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
      });
      return response;
    }

    // Try worker
    const worker = await Worker.findOne({ email });
    if (worker) {
      if (!worker.isActive) {
        return NextResponse.json({ error: 'حسابك غير نشط، تواصل مع المدير' }, { status: 401 });
      }
      const isValid = await bcrypt.compare(password, worker.password);
      if (!isValid) {
        return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
      }
      const token = signToken({ id: worker._id.toString(), email: worker.email, name: worker.name, role: 'worker', pageAccess: worker.pageAccess || [] });
      const response = NextResponse.json({ success: true, admin: { name: worker.name, email: worker.email, role: 'worker', pageAccess: worker.pageAccess || [] } });
      response.cookies.set('admin_token', token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 });
  }
}
