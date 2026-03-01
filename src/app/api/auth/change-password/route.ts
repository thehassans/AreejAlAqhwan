import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getAdminFromToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = await getAdminFromToken();
    if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    await dbConnect();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    const admin = await Admin.findById(payload.id);
    if (!admin) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
