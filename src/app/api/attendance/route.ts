import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Worker from '@/models/Worker';
import { validateQRCode } from '@/lib/qrAttendance';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const workerId = searchParams.get('workerId');

    const filter: Record<string, unknown> = {};
    if (date) filter.date = date;
    if (workerId) filter.workerId = workerId;

    const records = await Attendance.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { workerId, qrValue } = await req.json();

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    }

    const validation = validateQRCode(qrValue);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }
    const attendanceDate = validation.date;

    const existing = await Attendance.findOne({ workerId, date: attendanceDate });
    if (existing) {
      return NextResponse.json({ error: 'تم تسجيل الحضور لهذا اليوم بالفعل' }, { status: 400 });
    }

    // Record the check-in time in Saudi Arabia timezone (Asia/Riyadh, UTC+3) as HH:mm:ss (24h)
    const now = new Date();
    const checkInTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Riyadh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);

    const record = await Attendance.create({
      workerId: worker._id,
      workerName: worker.name,
      date: attendanceDate,
      checkInTime,
      method: 'qr',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
