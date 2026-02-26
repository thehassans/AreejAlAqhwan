import { NextResponse } from 'next/server';
import { generateDailyQRValue } from '@/lib/qrAttendance';

export async function GET() {
  try {
    const today = new Date().toLocaleDateString('en-CA');
    const qrValue = generateDailyQRValue(today);
    return NextResponse.json({ qrValue, date: today });
  } catch (error) {
    console.error('QR GET error:', error);
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
  }
}
