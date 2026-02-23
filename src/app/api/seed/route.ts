import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Settings from '@/models/Settings';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();

    const existingAdmin = await Admin.findOne({ email: 'admin@areej.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await Admin.create({
        name: 'Admin',
        email: 'admin@areej.com',
        password: hashedPassword,
      });
    }

    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({});
    }

    return NextResponse.json({ success: true, message: 'Seed completed' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
