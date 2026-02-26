'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiCalendar, FiClock, FiRefreshCw, FiSearch, FiFilter, FiDownload, FiCheckCircle, FiSmartphone } from 'react-icons/fi';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface AttendanceRecord {
  _id: string;
  workerName: string;
  workerId: string;
  date: string;
  checkInTime: string;
  method: 'qr' | 'manual';
  createdAt: string;
}

interface Worker {
  _id: string;
  name: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [today, setToday] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [search, setSearch] = useState('');
  const [qrLoading, setQrLoading] = useState(true);

  const todayFormatted = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const generateQR = useCallback(async () => {
    setQrLoading(true);
    try {
      const res = await fetch('/api/attendance/qr');
      const data = await res.json();
      setQrValue(data.qrValue);
      setToday(data.date);
      const url = await QRCode.toDataURL(data.qrValue, {
        width: 280,
        margin: 2,
        color: { dark: '#2C3E35', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(url);
    } catch {
      toast.error('فشل إنشاء رمز QR');
    } finally {
      setQrLoading(false);
    }
  }, []);

  const fetchData = useCallback(() => {
    const params = new URLSearchParams();
    if (filterDate) params.set('date', filterDate);
    if (filterWorker) params.set('workerId', filterWorker);

    Promise.all([
      fetch(`/api/attendance?${params}`).then(r => r.json()),
      fetch('/api/workers').then(r => r.json()),
    ]).then(([att, wrk]) => {
      setRecords(att);
      setWorkers(wrk);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filterDate, filterWorker]);

  useEffect(() => { generateQR(); }, [generateQR]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = records.filter(r =>
    r.workerName.toLowerCase().includes(search.toLowerCase())
  );

  const todayCount = records.filter(r => r.date === today).length;
  const qrCount = records.filter(r => r.method === 'qr').length;
  const manualCount = records.filter(r => r.method === 'manual').length;

  const fmtDate = (d: string) => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">سجل الحضور</h1>
          <p className="text-sm text-gray-500 mt-0.5">{todayFormatted}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
        >
          <FiRefreshCw size={15} />
          تحديث
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <FiCheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{todayCount}</p>
              <p className="text-xs text-gray-500">حضور اليوم</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FiSmartphone size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{qrCount}</p>
              <p className="text-xs text-gray-500">عبر QR</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <FiCalendar size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{manualCount}</p>
              <p className="text-xs text-gray-500">يدوي</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily QR Code */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#2C3E35] to-[#5B7B6D] p-5 text-white">
              <div className="flex items-center gap-2 mb-1">
                <FiSmartphone size={18} />
                <h2 className="font-bold text-base">رمز QR اليومي</h2>
              </div>
              <p className="text-xs text-white/70">يتغير يومياً — صالح فقط اليوم</p>
            </div>

            <div className="p-6 flex flex-col items-center">
              {qrLoading ? (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-2xl">
                  <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
                </div>
              ) : qrDataUrl ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#5B7B6D]/5 to-transparent rounded-2xl" />
                  <img
                    src={qrDataUrl}
                    alt="Daily QR Code"
                    className="w-[220px] h-[220px] rounded-2xl border-4 border-[#5B7B6D]/10"
                  />
                </div>
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 text-sm">
                  فشل التحميل
                </div>
              )}

              <div className="mt-4 text-center space-y-2 w-full">
                <div className="bg-gray-50 rounded-xl px-4 py-2.5">
                  <p className="text-xs text-gray-400 mb-0.5">تاريخ الرمز</p>
                  <p className="text-sm font-bold text-gray-700" dir="ltr">{today}</p>
                </div>
                <div className="bg-[#5B7B6D]/5 rounded-xl px-4 py-2.5">
                  <p className="text-xs text-[#5B7B6D] font-medium">الموظف يقوم بمسح هذا الرمز</p>
                  <p className="text-xs text-[#5B7B6D]/70">من لوحة الموظف لتسجيل الحضور</p>
                </div>
                <button
                  onClick={generateQR}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#5B7B6D] text-white rounded-xl text-sm font-semibold hover:bg-[#4a6a5c] transition-all"
                >
                  <FiRefreshCw size={14} />
                  إعادة توليد
                </button>
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`qr-attendance-${today}.png`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
                  >
                    <FiDownload size={14} />
                    تنزيل QR
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[160px] relative">
                <FiSearch size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الموظف..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              <div className="relative">
                <FiCalendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="pr-9 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              <div className="relative">
                <FiFilter size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={filterWorker}
                  onChange={e => setFilterWorker(e.target.value)}
                  className="pr-9 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none bg-gray-50 focus:bg-white transition-all appearance-none"
                >
                  <option value="">جميع الموظفين</option>
                  {workers.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FiCalendar size={32} className="mb-3 text-gray-200" />
                <p className="font-medium">لا توجد سجلات حضور</p>
                <p className="text-xs mt-1 text-gray-300">سيظهر هنا حضور الموظفين</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الموظف</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">التاريخ</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">وقت الحضور</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الطريقة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#5B7B6D]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-[#5B7B6D] font-bold text-sm">{record.workerName.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{record.workerName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600" dir="ltr">{fmtDate(record.date)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <FiClock size={13} className="text-gray-400" />
                            <span dir="ltr">{record.checkInTime}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold ${
                            record.method === 'qr'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {record.method === 'qr' ? (
                              <><FiSmartphone size={11} /> QR Scanner</>
                            ) : (
                              <><FiCheckCircle size={11} /> يدوي</>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
