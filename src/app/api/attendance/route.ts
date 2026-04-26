import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Worker from '@/models/Worker';
import { validateQRCode } from '@/lib/qrAttendance';

 function getSaudiTimeParts(date: Date) {
   const parts = new Intl.DateTimeFormat('en-GB', {
     timeZone: 'Asia/Riyadh',
     year: 'numeric',
     month: '2-digit',
     day: '2-digit',
     hour: '2-digit',
     minute: '2-digit',
     second: '2-digit',
     hour12: false,
   }).formatToParts(date);

   const get = (type: string) => parts.find((part) => part.type === type)?.value || '00';

   return {
     year: get('year'),
     month: get('month'),
     day: get('day'),
     hour: get('hour'),
     minute: get('minute'),
     second: get('second'),
     time: `${get('hour')}:${get('minute')}:${get('second')}`,
   };
 }

 function getWorkedMinutes(attendanceDate: string, checkInTime: string, checkOutTime: string) {
   const checkIn = new Date(`${attendanceDate}T${checkInTime}+03:00`);
   const checkOut = new Date(`${attendanceDate}T${checkOutTime}+03:00`);
   const diffMs = checkOut.getTime() - checkIn.getTime();

   if (!Number.isFinite(diffMs) || diffMs < 0) return 0;

   return Math.floor(diffMs / 60000);
 }

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const workerId = searchParams.get('workerId');

    const filter: Record<string, unknown> = {};
    if (date) filter.date = date;
    if (workerId) filter.workerId = workerId;

    const records = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });
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

    const now = new Date();
    const saudiNow = getSaudiTimeParts(now);
    const existing = await Attendance.findOne({ workerId, date: attendanceDate }).sort({ createdAt: -1 });

    if (!existing) {
      const previousOpenShift = await Attendance.findOne({
        workerId,
        checkOutTime: null,
      }).sort({ date: -1, createdAt: -1 });

      if (previousOpenShift && previousOpenShift.date !== attendanceDate) {
        return NextResponse.json({ error: `يوجد دوام مفتوح بتاريخ ${previousOpenShift.date}. يرجى تسجيل الانصراف أو مراجعة الإدارة قبل تسجيل حضور جديد` }, { status: 400 });
      }
    }

    if (!existing) {
      const record = await Attendance.create({
        workerId: worker._id,
        workerName: worker.name,
        date: attendanceDate,
        checkInTime: saudiNow.time,
        checkOutTime: null,
        workedMinutes: 0,
        status: 'checked_in',
        method: 'qr',
      });

      return NextResponse.json({ action: 'check_in', record }, { status: 201 });
    }

    if (!existing.checkOutTime) {
      const checkOutTime = saudiNow.time;
      const workedMinutes = getWorkedMinutes(attendanceDate, existing.checkInTime, checkOutTime);

      existing.checkOutTime = checkOutTime;
      existing.workedMinutes = workedMinutes;
      existing.status = 'checked_out';
      existing.method = 'qr';
      await existing.save();

      return NextResponse.json({ action: 'check_out', record: existing });
    }

    return NextResponse.json({ error: 'تم تسجيل الحضور والانصراف لهذا اليوم بالفعل' }, { status: 400 });
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
