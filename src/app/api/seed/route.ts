import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Settings from '@/models/Settings';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();

    const adminName = process.env.ADMIN_NAME || 'Admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@areej.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await Admin.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
      });
    } else {
      // Sync existing admin with env values (name + password)
      existingAdmin.name = adminName;
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
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
