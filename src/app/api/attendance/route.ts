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
    const { workerId, qrValue, method } = await req.json();

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    }

    let attendanceDate: string;

    if (method === 'qr') {
      const validation = validateQRCode(qrValue);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.message }, { status: 400 });
      }
      attendanceDate = validation.date;
    } else {
      attendanceDate = new Date().toLocaleDateString('en-CA');
    }

    const existing = await Attendance.findOne({ workerId, date: attendanceDate });
    if (existing) {
      return NextResponse.json({ error: 'تم تسجيل الحضور لهذا اليوم بالفعل' }, { status: 400 });
    }

    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const record = await Attendance.create({
      workerId: worker._id,
      workerName: worker.name,
      date: attendanceDate,
      checkInTime,
      method: method || 'qr',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
