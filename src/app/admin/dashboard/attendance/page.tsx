'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FiCalendar, FiClock, FiRefreshCw, FiSearch, FiFilter, FiDownload, FiCheckCircle, FiSmartphone, FiCamera, FiX, FiUser } from 'react-icons/fi';
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

interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'worker';
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [today, setToday] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [search, setSearch] = useState('');
  const [qrLoading, setQrLoading] = useState(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Camera scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const scannedRef = useRef(false);

  const todayFormatted = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Fetch auth user on mount
  useEffect(() => {
    fetch('/api/auth/check').then(r => r.json()).then(data => {
      if (data.authenticated) setAuthUser(data.admin);
    });
  }, []);

  const generateQR = useCallback(async () => {
    setQrLoading(true);
    try {
      const res = await fetch('/api/attendance/qr');
      const data = await res.json();
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
      setRecords(Array.isArray(att) ? att : []);
      setWorkers(Array.isArray(wrk) ? wrk : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filterDate, filterWorker]);

  useEffect(() => { generateQR(); }, [generateQR]);
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Camera scanner ──────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const closeScanner = useCallback(() => {
    stopCamera();
    setScannerOpen(false);
    setScanSuccess(false);
    setScanError('');
    scannedRef.current = false;
  }, [stopCamera]);

  const submitAttendance = useCallback(async (qrValue: string) => {
    if (!authUser) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: authUser.id, qrValue, method: 'qr' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error || 'فشل تسجيل الحضور');
      } else {
        setScanSuccess(true);
        toast.success('تم تسجيل حضورك بنجاح! ✓');
        fetchData();
        setTimeout(() => closeScanner(), 2500);
      }
    } catch {
      setScanError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  }, [authUser, fetchData, closeScanner]);

  const startCamera = useCallback(async () => {
    setScanError('');
    setScanSuccess(false);
    scannedRef.current = false;
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const tick = async () => {
        if (scannedRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { animFrameRef.current = requestAnimationFrame(tick); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const jsQR = (await import('jsqr')).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

        if (code && code.data) {
          scannedRef.current = true;
          stopCamera();
          await submitAttendance(code.data);
        } else {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      setScanError('تعذر الوصول للكاميرا. يرجى السماح بالوصول وإعادة المحاولة.');
      setScanning(false);
    }
  }, [stopCamera, submitAttendance]);

  useEffect(() => {
    if (scannerOpen) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [scannerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────────────────────────────────────────────────────────────────────

  const myRecords = authUser?.role === 'worker'
    ? records.filter(r => r.workerId === authUser.id)
    : records;

  const filtered = myRecords.filter(r =>
    r.workerName.toLowerCase().includes(search.toLowerCase())
  );

  const todayCount = records.filter(r => r.date === today).length;
  const qrCount = records.filter(r => r.method === 'qr').length;
  const manualCount = records.filter(r => r.method === 'manual').length;

  const fmtDate = (d: string) => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const isWorker = authUser?.role === 'worker';
  const todayAlreadyMarked = isWorker && records.some(r => r.workerId === authUser?.id && r.date === today);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">سجل الحضور</h1>
          <p className="text-sm text-gray-500 mt-0.5">{todayFormatted}</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
          <FiRefreshCw size={15} />
          تحديث
        </button>
      </div>

      {/* ── WORKER VIEW ─────────────────────────────────────── */}
      {isWorker && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#2C3E35] to-[#5B7B6D] p-6 text-white">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FiUser size={20} />
              </div>
              <div>
                <p className="font-bold text-lg">مرحباً، {authUser?.name}</p>
                <p className="text-white/70 text-sm">سجّل حضورك اليومي بمسح رمز QR</p>
              </div>
            </div>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            {todayAlreadyMarked ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                  <FiCheckCircle size={40} className="text-emerald-500" />
                </div>
                <p className="text-xl font-bold text-gray-800">تم تسجيل حضورك اليوم ✓</p>
                <p className="text-sm text-gray-500">
                  وقت الحضور: <span dir="ltr" className="font-semibold">{records.find(r => r.workerId === authUser?.id && r.date === today)?.checkInTime}</span>
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm text-center">اضغط على الزر لفتح الكاميرا ومسح رمز QR اليومي</p>
                <button
                  onClick={() => setScannerOpen(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#2C3E35] to-[#5B7B6D] text-white rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <FiCamera size={24} />
                  مسح رمز QR للحضور
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN STATS ─────────────────────────────────────── */}
      {!isWorker && (
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
      )}

      <div className={`grid grid-cols-1 ${!isWorker ? 'lg:grid-cols-3' : ''} gap-6`}>
        {/* Daily QR Code — admin only */}
        {!isWorker && (
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
                  <img src={qrDataUrl} alt="Daily QR Code" className="w-[220px] h-[220px] rounded-2xl border-4 border-[#5B7B6D]/10" />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 text-sm">فشل التحميل</div>
                )}
                <div className="mt-4 text-center space-y-2 w-full">
                  <div className="bg-gray-50 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">تاريخ الرمز</p>
                    <p className="text-sm font-bold text-gray-700" dir="ltr">{today}</p>
                  </div>
                  <button onClick={generateQR} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#5B7B6D] text-white rounded-xl text-sm font-semibold hover:bg-[#4a6a5c] transition-all">
                    <FiRefreshCw size={14} />
                    إعادة توليد
                  </button>
                  {qrDataUrl && (
                    <a href={qrDataUrl} download={`qr-attendance-${today}.png`} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">
                      <FiDownload size={14} />
                      تنزيل QR
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div className={`${!isWorker ? 'lg:col-span-2' : ''} space-y-4`}>
          {/* Filters — admin sees all, worker sees only search */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[160px] relative">
                <FiSearch size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={isWorker ? 'بحث في سجلاتي...' : 'بحث باسم الموظف...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              {!isWorker && (
                <>
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
                      {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                    </select>
                  </div>
                </>
              )}
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
                <p className="text-xs mt-1 text-gray-300">{isWorker ? 'لم تسجل حضوراً بعد' : 'سيظهر هنا حضور الموظفين'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {!isWorker && <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الموظف</th>}
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">التاريخ</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">وقت الحضور</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">الطريقة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                        {!isWorker && (
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#5B7B6D]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-[#5B7B6D] font-bold text-sm">{record.workerName.charAt(0)}</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-800">{record.workerName}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-5 py-4 text-sm text-gray-600" dir="ltr">{fmtDate(record.date)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <FiClock size={13} className="text-gray-400" />
                            <span dir="ltr">{record.checkInTime}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold ${record.method === 'qr' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                            {record.method === 'qr' ? <><FiSmartphone size={11} /> QR</> : <><FiCheckCircle size={11} /> يدوي</>}
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

      {/* ── Camera Scanner Modal ─────────────────────────────── */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-sm shadow-2xl">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-[#2C3E35] to-[#5B7B6D] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <FiCamera size={20} />
                <span className="font-bold">مسح رمز QR</span>
              </div>
              <button onClick={closeScanner} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all">
                <FiX size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center gap-4">
              {scanSuccess ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center animate-bounce">
                    <FiCheckCircle size={48} className="text-emerald-500" />
                  </div>
                  <p className="text-xl font-bold text-gray-800">تم تسجيل حضورك!</p>
                  <p className="text-sm text-gray-500 text-center">تم تسجيل حضورك بنجاح ✓</p>
                </div>
              ) : scanError ? (
                <div className="flex flex-col items-center gap-4 py-4 w-full">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                    <FiX size={32} className="text-red-500" />
                  </div>
                  <p className="text-red-600 font-semibold text-center">{scanError}</p>
                  <button
                    onClick={() => { setScanError(''); scannedRef.current = false; startCamera(); }}
                    className="w-full py-3 bg-[#5B7B6D] text-white rounded-xl font-semibold hover:bg-[#4a6a5c] transition-all"
                  >
                    حاول مرة أخرى
                  </button>
                </div>
              ) : (
                <>
                  {/* Camera viewfinder */}
                  <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                        {scanning && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#5B7B6D] animate-[scanline_2s_ease-in-out_infinite]" />
                        )}
                      </div>
                    </div>
                    {submitting && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 text-center">وجّه الكاميرا نحو رمز QR اليومي المعروض</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scanline {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
