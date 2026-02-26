import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Worker from '@/models/Worker';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();
    const workers = await Worker.find().select('-password').sort({ createdAt: -1 });
    return NextResponse.json(workers);
  } catch (error) {
    console.error('Workers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, phone, email, password, pageAccess, isActive } = await req.json();

    if (!name || !phone || !email || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const existing = await Worker.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const worker = await Worker.create({
      name, phone, email,
      password: hashed,
      pageAccess: pageAccess || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    const { password: _, ...workerData } = worker.toObject();
    return NextResponse.json(workerData, { status: 201 });
  } catch (error) {
    console.error('Workers POST error:', error);
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}
