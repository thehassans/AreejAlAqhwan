import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Worker from '@/models/Worker';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'areej-jwt-secret-2024';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    const worker = await Worker.findOne({ email, isActive: true });
    if (!worker) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة أو الحساب غير نشط' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, worker.password);
    if (!isValid) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: worker._id.toString(), email: worker.email, name: worker.name, role: 'worker', pageAccess: worker.pageAccess },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      worker: { name: worker.name, email: worker.email, pageAccess: worker.pageAccess },
    });
    response.cookies.set('worker_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Worker login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 });
  }
}
