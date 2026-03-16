'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiCamera, FiCheckCircle, FiCalendar, FiClock, FiTrendingUp } from 'react-icons/fi';

interface AttendanceRecord {
  _id: string;
  date: string;
  checkInTime: string;
  method: 'qr';
}

interface WorkerInfo {
  id: string;
  name: string;
  pageAccess: string[];
}

export default function WorkerDashboardHome() {
  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayMarked, setTodayMarked] = useState(false);

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
  const todayAr = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Riyadh',
  });

  useEffect(() => {
    fetch('/api/worker-auth/check')
      .then(r => r.json())
      .then(data => {
        if (data.worker) {
          setWorker(data.worker);
          fetch(`/api/attendance?workerId=${data.worker.id}`)
            .then(r => r.json())
            .then(att => {
              if (Array.isArray(att)) {
                setMyAttendance(att.slice(0, 10));
                setTodayMarked(att.some((a: AttendanceRecord) => a.date === today));
              }
              setLoading(false);
            })
            .catch(() => setLoading(false));
        }
      })
      .catch(() => setLoading(false));
  }, [today]);

  const fmtDate = (d: string) => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#2C3E35] to-[#5B7B6D] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">مرحباً بعودتك 🌸</p>
            <h1 className="text-xl font-bold mt-0.5">{worker?.name}</h1>
            <p className="text-white/60 text-xs mt-1">{todayAr}</p>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${todayMarked ? 'bg-emerald-400/20' : 'bg-white/10'}`}>
            {todayMarked ? '✅' : '🕐'}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          {todayMarked ? (
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
              <FiCheckCircle size={16} />
              تم تسجيل حضورك اليوم بنجاح
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">لم يتم تسجيل حضورك اليوم</span>
              <Link
                href="/worker/dashboard/scan"
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#2C3E35] rounded-xl text-sm font-bold hover:bg-white/90 transition-all"
              >
                <FiCamera size={15} />
                سجّل الآن
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <FiCheckCircle size={20} className="text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-800">{myAttendance.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">إجمالي الحضور</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <FiTrendingUp size={20} className="text-blue-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">
            {myAttendance.filter(a => a.method === 'qr').length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">عبر QR</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <FiCalendar size={20} className="text-purple-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">
            {worker?.pageAccess?.length || 0}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">صلاحيات</p>
        </div>
      </div>

      {/* Attendance QR Button */}
      {!todayMarked && (
        <Link
          href="/worker/dashboard/scan"
          className="block bg-white rounded-2xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 p-6 text-center group transition-all hover:shadow-md"
        >
          <div className="w-16 h-16 bg-emerald-50 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
            <FiCamera size={28} className="text-emerald-600" />
          </div>
          <p className="font-bold text-gray-800 text-base">امسح QR لتسجيل الحضور</p>
          <p className="text-sm text-gray-400 mt-1">اضغط هنا لفتح الكاميرا ومسح رمز الحضور اليومي</p>
        </Link>
      )}

      {/* Recent Attendance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-800">سجل الحضور الأخير</h2>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{myAttendance.length} سجل</span>
        </div>
        {myAttendance.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FiCalendar size={32} className="mb-3 text-gray-200" />
            <p className="text-sm">لا توجد سجلات حضور بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {myAttendance.map(record => (
              <div key={record._id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${record.date === today ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                    <FiCalendar size={15} className={record.date === today ? 'text-emerald-500' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800" dir="ltr">{fmtDate(record.date)}</p>
                    {record.date === today && (
                      <span className="text-xs text-emerald-600 font-medium">اليوم ✓</span>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <FiClock size={13} className="text-gray-400" />
                    <span dir="ltr">{record.checkInTime}</span>
                  </div>
                  <span className="text-xs mt-0.5 block text-left text-blue-500">
                    📱 QR
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
