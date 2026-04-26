'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FiCalendar, FiClock, FiRefreshCw, FiSearch, FiFilter, FiDownload, FiCheckCircle, FiSmartphone, FiCamera, FiX, FiUser } from 'react-icons/fi';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { useT, useLocale } from '@/lib/i18n';

type AttendanceOverviewStatus = 'absent' | 'checked_in' | 'checked_out';

interface EmployeeOverviewItem {
  worker: Worker;
  record?: AttendanceRecord;
  status: AttendanceOverviewStatus;
}

interface AttendanceRecord {
  _id: string;
  workerName: string;
  workerId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string | null;
  workedSeconds?: number;
  workedMinutes?: number;
  status?: 'checked_in' | 'checked_out';
  method: 'qr';
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
  const t = useT();
  const { lang } = useLocale();
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
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Camera scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanAction, setScanAction] = useState<'check_in' | 'check_out' | null>(null);
  const [scanError, setScanError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const scannedRef = useRef(false);

  const todayFormatted = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Riyadh',
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
      toast.error(t('فشل إنشاء رمز QR', 'Failed to generate QR code'));
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
  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

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
    setScanAction(null);
    setScanError('');
    scannedRef.current = false;
  }, [stopCamera]);

  const submitAttendance = useCallback(async (qrValue: string) => {
    if (!authUser) {
      setScanError(t('تعذر التحقق من هويتك. يرجى تسجيل الخروج وإعادة الدخول.', 'Could not verify your identity. Please log out and sign in again.'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: authUser.id, qrValue, method: 'qr' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error || t('فشل تسجيل الحضور', 'Attendance failed'));
      } else {
        setScanAction(data.action === 'check_out' ? 'check_out' : 'check_in');
        setScanSuccess(true);
        toast.success(
          data.action === 'check_out'
            ? t('تم تسجيل الانصراف بنجاح! ✓', 'Departure recorded successfully! ✓')
            : t('تم تسجيل الحضور بنجاح! ✓', 'Arrival recorded successfully! ✓')
        );
        fetchData();
        setTimeout(() => closeScanner(), 2500);
      }
    } catch {
      setScanError(t('حدث خطأ، حاول مرة أخرى', 'An error occurred, please try again'));
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
      // Load jsQR once before starting the loop
      const jsQR = (await import('jsqr')).default;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const tick = () => {
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
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) {
          scannedRef.current = true;
          stopCamera();
          submitAttendance(code.data);
        } else {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      setScanError(t('تعذر الوصول للكاميرا. يرجى السماح بالوصول وإعادة المحاولة.', 'Cannot access camera. Please allow access and try again.'));
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

  const overviewDate = filterDate || today;
  const overviewRecords = overviewDate ? records.filter((r: AttendanceRecord) => r.date === overviewDate) : [];

  const parseSaudiDateTime = (attendanceDate: string, timeValue: string) => new Date(`${attendanceDate}T${timeValue}+03:00`);

  const getDurationSeconds = (record?: AttendanceRecord | null) => {
    if (!record) return null;

    if (typeof record.workedSeconds === 'number' && record.workedSeconds > 0) {
      return record.workedSeconds;
    }

    if (record.checkOutTime) {
      const diffMs = parseSaudiDateTime(record.date, record.checkOutTime).getTime() - parseSaudiDateTime(record.date, record.checkInTime).getTime();
      return Number.isFinite(diffMs) && diffMs >= 0 ? Math.floor(diffMs / 1000) : 0;
    }

    const diffMs = nowMs - parseSaudiDateTime(record.date, record.checkInTime).getTime();
    return Number.isFinite(diffMs) && diffMs >= 0 ? Math.floor(diffMs / 1000) : 0;
  };

  const fmtDate = (d: string) => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const fmtDuration = (totalSeconds?: number | null) => {
    if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '--';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  };

  const fmtDurationMeta = (totalSeconds?: number | null) => {
    if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '--';
    if (totalSeconds < 60) return `${totalSeconds}s`;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0 && seconds > 0) return `${minutes}m ${seconds}s`;
    return `${minutes}m`;
  };

  const isWorker = authUser?.role === 'worker';
  const todayRecord = isWorker ? records.find((r: AttendanceRecord) => r.workerId === authUser?.id && r.date === today) || null : null;
  const todayAlreadyMarked = !!todayRecord;
  const todayHasDeparted = !!todayRecord?.checkOutTime;
  const nextAttendanceAction = todayAlreadyMarked && !todayHasDeparted
    ? t('مسح رمز QR للانصراف', 'Scan QR to check out')
    : t('مسح رمز QR للحضور', 'Scan QR to check in');
  const overviewByWorkerId = new Map<string, AttendanceRecord>(overviewRecords.map((record: AttendanceRecord) => [record.workerId, record]));
  const overviewWorkers = workers.filter((worker: Worker) => (!filterWorker || worker._id === filterWorker) && worker.name.toLowerCase().includes(search.toLowerCase()));
  const employeeOverview: EmployeeOverviewItem[] = overviewWorkers
    .map((worker: Worker) => {
      const record = overviewByWorkerId.get(worker._id);
      const status: AttendanceOverviewStatus = !record ? 'absent' : record.checkOutTime ? 'checked_out' : 'checked_in';
      return { worker, record, status };
    })
    .sort((a: EmployeeOverviewItem, b: EmployeeOverviewItem) => {
      const rank: Record<AttendanceOverviewStatus, number> = { checked_in: 0, checked_out: 1, absent: 2 };
      return rank[a.status] - rank[b.status] || a.worker.name.localeCompare(b.worker.name);
    });
  const overviewArrivalCount = employeeOverview.filter((item: EmployeeOverviewItem) => item.status !== 'absent').length;
  const overviewDepartureCount = employeeOverview.filter((item: EmployeeOverviewItem) => item.status === 'checked_out').length;
  const overviewInsideCount = employeeOverview.filter((item: EmployeeOverviewItem) => item.status === 'checked_in').length;
  const overviewAbsentCount = employeeOverview.filter((item: EmployeeOverviewItem) => item.status === 'absent').length;
  const overviewTotalWorkedSeconds = employeeOverview.reduce((total: number, item: EmployeeOverviewItem) => total + (item.status === 'checked_out' ? (getDurationSeconds(item.record) || 0) : 0), 0);
  const overviewLiveWorkedSeconds = employeeOverview.reduce((total: number, item: EmployeeOverviewItem) => total + (item.status === 'checked_in' ? (getDurationSeconds(item.record) || 0) : 0), 0);
  const overviewAverageWorkedSeconds = overviewDepartureCount > 0 ? Math.floor(overviewTotalWorkedSeconds / overviewDepartureCount) : 0;
  const filteredTotalWorkedSeconds = filtered.reduce((total: number, record: AttendanceRecord) => total + (getDurationSeconds(record) || 0), 0);
  const filteredCompletedWorkedSeconds = filtered.reduce((total: number, record: AttendanceRecord) => total + (record.checkOutTime ? (getDurationSeconds(record) || 0) : 0), 0);
  const filteredCompletedCount = filtered.filter((record: AttendanceRecord) => !!record.checkOutTime).length;
  const overviewDateLabel = overviewDate ? fmtDate(overviewDate) : '--';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('سجل الحضور', 'Attendance log')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{todayFormatted}</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
          <FiRefreshCw size={15} />
          {t('تحديث', 'Refresh')}
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
                <p className="font-bold text-lg">{t('مرحباً،', 'Welcome,')} {authUser?.name}</p>
                <p className="text-white/70 text-sm">{t('استخدم نفس رمز QR لتسجيل الحضور أولاً ثم الانصراف لاحقاً', 'Use the same daily QR to record arrival first, then departure later')}</p>
              </div>
            </div>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            {todayAlreadyMarked && todayHasDeparted ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                  <FiCheckCircle size={40} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{t('أريج الأقحوان', 'Areej Al Aqhwan')} ✅</p>
                  <p className="text-sm text-emerald-600 font-semibold">{t('تم تسجيل الحضور والانصراف اليوم', 'Your arrival and departure are recorded for today')}</p>
                  <p className="text-sm text-gray-500">
                    {t('وقت الحضور بتوقيت السعودية', 'Arrival time (Saudi)')}: <span dir="ltr" className="font-semibold">{todayRecord?.checkInTime}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('وقت الانصراف بتوقيت السعودية', 'Departure time (Saudi)')}: <span dir="ltr" className="font-semibold">{todayRecord?.checkOutTime}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('مدة الدوام', 'Worked duration')}: <span dir="ltr" className="font-semibold">{fmtDuration(getDurationSeconds(todayRecord))}</span>
                  </p>
                </div>
              </div>
            ) : todayAlreadyMarked ? (
              <>
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
                    <FiClock size={40} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-800">{t('تم تسجيل الحضور', 'Arrival recorded')}</p>
                    <p className="text-sm text-amber-600 font-semibold">{t('باقي تسجيل الانصراف قبل نهاية اليوم', 'Departure still needs to be recorded before the end of the day')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('وقت الحضور بتوقيت السعودية', 'Arrival time (Saudi)')}: <span dir="ltr" className="font-semibold">{todayRecord?.checkInTime}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('المدة الحالية', 'Live duration')}: <span dir="ltr" className="font-semibold">{fmtDuration(getDurationSeconds(todayRecord))}</span>
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 text-sm text-center">{t('عند الانتهاء من الدوام، امسح نفس رمز QR لتسجيل الانصراف', 'At the end of the shift, scan the same daily QR to record departure')}</p>
                <button
                  onClick={() => setScannerOpen(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <FiCamera size={24} />
                  {nextAttendanceAction}
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm text-center">{t('اضغط على الزر لفتح الكاميرا ومسح رمز QR اليومي لتسجيل الحضور', 'Tap the button to open the camera and scan today’s QR code to record arrival')}</p>
                <button
                  onClick={() => setScannerOpen(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#2C3E35] to-[#5B7B6D] text-white rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <FiCamera size={24} />
                  {nextAttendanceAction}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN STATS ─────────────────────────────────────── */}
      {!isWorker && (
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <FiCheckCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{overviewArrivalCount}</p>
                <p className="text-xs text-gray-500">{t('تسجيلات الحضور', 'Arrivals')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <FiClock size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{overviewInsideCount}</p>
                <p className="text-xs text-gray-500">{t('داخل الدوام', 'On shift')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <FiSmartphone size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{overviewDepartureCount}</p>
                <p className="text-xs text-gray-500">{t('تسجيلات الانصراف', 'Departures')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <FiClock size={20} className="text-violet-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800" dir="ltr">{fmtDuration(overviewTotalWorkedSeconds)}</p>
                <p className="text-xs text-gray-500">{t('إجمالي الوقت', 'Total worked')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <FiClock size={20} className="text-slate-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800" dir="ltr">{fmtDuration(overviewAverageWorkedSeconds)}</p>
                <p className="text-xs text-gray-500">{t('متوسط الدوام', 'Average shift')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 col-span-2 xl:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <FiUser size={20} className="text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{overviewAbsentCount}</p>
                <p className="text-xs text-gray-500">{t('غائبون', 'Absent')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isWorker && (
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-[#2C3E35] to-[#5B7B6D] px-6 py-6 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/60 mb-2">{t('لوحة الحضور', 'Attendance board')}</p>
                <h2 className="text-2xl font-bold">{t('حالة كل موظف', 'Attendance for each employee')}</h2>
                <p className="text-sm text-white/70 mt-1">{t('عرض مباشر يوضح من حضر، من لا يزال في الدوام، ومن أكمل الانصراف', 'A live overview showing who arrived, who is still on shift, and who completed departure')}</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 min-w-[180px]">
                <p className="text-xs text-white/60 mb-1">{t('التاريخ المعروض', 'Viewing date')}</p>
                <p className="text-base font-bold" dir="ltr">{overviewDateLabel}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400 mb-1">{t('إجمالي الوقت', 'Total worked')}</p>
                <p className="text-xl font-bold text-gray-800" dir="ltr">{fmtDuration(overviewTotalWorkedSeconds)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('مجموع الدوامات المكتملة في التاريخ المحدد', 'Sum of all completed shifts for the selected date')}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400 mb-1">{t('الوقت المباشر', 'Live now')}</p>
                <p className="text-xl font-bold text-gray-800" dir="ltr">{fmtDuration(overviewLiveWorkedSeconds)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('الوقت الجاري للموظفين الموجودين في الدوام الآن', 'Running time for employees currently on shift')}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400 mb-1">{t('متوسط الدوام', 'Average shift')}</p>
                <p className="text-xl font-bold text-gray-800" dir="ltr">{fmtDuration(overviewAverageWorkedSeconds)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('متوسط الوقت للدوامات المكتملة', 'Average time across completed shifts')}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400 mb-1">{t('الموظفون المعروضون', 'Employees shown')}</p>
                <p className="text-xl font-bold text-gray-800">{employeeOverview.length}</p>
                <p className="text-xs text-gray-500 mt-1">{t('بعد تطبيق البحث والفلاتر الحالية', 'After applying current search and filters')}</p>
              </div>
            </div>

            {employeeOverview.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 px-6 py-14 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                  <FiCalendar size={28} className="text-gray-300" />
                </div>
                <p className="text-base font-semibold text-gray-600">{t('لا يوجد موظفون مطابقون للفلاتر الحالية', 'No employees match the current filters')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('جرّب إزالة البحث أو اختيار موظف مختلف', 'Try clearing the search or choosing a different employee')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {employeeOverview.map(({ worker, record, status }) => (
                  <div
                    key={worker._id}
                    className={`rounded-[26px] border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                      status === 'checked_in'
                        ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50'
                        : status === 'checked_out'
                          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50'
                          : 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          status === 'checked_in'
                            ? 'bg-amber-100 text-amber-700'
                            : status === 'checked_out'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}>
                          {worker.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-gray-800 truncate">{worker.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {record ? t('تم التسجيل عبر QR', 'Recorded via QR') : t('لا يوجد تسجيل لهذا التاريخ', 'No record for this date')}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                        status === 'checked_in'
                          ? 'bg-amber-100 text-amber-700'
                          : status === 'checked_out'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          status === 'checked_in'
                            ? 'bg-amber-500'
                            : status === 'checked_out'
                              ? 'bg-emerald-500'
                              : 'bg-rose-500'
                        }`} />
                        {status === 'checked_in'
                          ? t('داخل الدوام', 'On shift')
                          : status === 'checked_out'
                            ? t('مكتمل', 'Completed')
                            : t('غائب', 'Absent')}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2.5">
                      <div className="rounded-2xl bg-white/80 border border-white px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-400 mb-1">{t('الحضور', 'Arrival')}</p>
                        <p className="text-sm font-bold text-gray-800" dir="ltr">{record?.checkInTime || '--'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/80 border border-white px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-400 mb-1">{t('الانصراف', 'Departure')}</p>
                        <p className="text-sm font-bold text-gray-800" dir="ltr">{record?.checkOutTime || '--'}</p>
                      </div>
                      <div className={`rounded-2xl border px-3 py-3 ${status === 'checked_in' ? 'bg-amber-50 border-amber-100' : status === 'checked_out' ? 'bg-emerald-50 border-emerald-100' : 'bg-white/80 border-white'}`}>
                        <p className="text-[11px] font-medium text-gray-400 mb-1">{t('المدة', 'Duration')}</p>
                        <p className="text-sm font-bold text-gray-800" dir="ltr">{record ? fmtDuration(getDurationSeconds(record)) : '--'}</p>
                        <p className="text-[11px] text-gray-500 mt-1" dir="ltr">{record ? fmtDurationMeta(getDurationSeconds(record)) : '--'}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div className="rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-medium text-gray-600 flex-1">
                        {status === 'checked_in'
                          ? t('الموظف داخل الدوام حالياً ولم يسجل الانصراف بعد', 'This employee is currently on shift and has not checked out yet')
                          : status === 'checked_out'
                            ? t('تم تسجيل الحضور والانصراف لهذا الموظف بنجاح', 'Arrival and departure have been fully recorded for this employee')
                            : t('لا يوجد تسجيل حضور لهذا الموظف في التاريخ المعروض', 'No attendance has been recorded for this employee on the selected date')}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400 mb-1">{t('الوقت المقضي', 'Time spent')}</p>
                        <p className="text-lg font-bold text-gray-800" dir="ltr">{record ? fmtDuration(getDurationSeconds(record)) : '--'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  <h2 className="font-bold text-base">{t('رمز QR اليومي', 'Daily QR code')}</h2>
                </div>
                <p className="text-xs text-white/70">{t('يتغير يومياً — صالح فقط اليوم', 'Changes daily — valid today only')}</p>
              </div>
              <div className="p-6 flex flex-col items-center">
                {qrLoading ? (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-2xl">
                    <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="Daily QR Code" className="w-[220px] h-[220px] rounded-2xl border-4 border-[#5B7B6D]/10" />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 text-sm">{t('فشل التحميل', 'Failed to load')}</div>
                )}
                <div className="mt-4 text-center space-y-2 w-full">
                  <div className="bg-gray-50 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">{t('تاريخ الرمز', 'QR date')}</p>
                    <p className="text-sm font-bold text-gray-700" dir="ltr">{today}</p>
                  </div>
                  <button onClick={generateQR} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#5B7B6D] text-white rounded-xl text-sm font-semibold hover:bg-[#4a6a5c] transition-all">
                    <FiRefreshCw size={14} />
                    {t('إعادة توليد', 'Regenerate')}
                  </button>
                  {qrDataUrl && (
                    <a href={qrDataUrl} download={`qr-attendance-${today}.png`} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">
                      <FiDownload size={14} />
                      {t('تنزيل QR', 'Download QR')}
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
                  placeholder={isWorker ? t('بحث في سجلاتي...', 'Search my records...') : t('بحث باسم الموظف...', 'Search by employee name...')}
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
                      <option value="">{t('جميع الموظفين', 'All employees')}</option>
                      {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400 mb-1">{t('إجمالي السجلات المعروضة', 'Visible total time')}</p>
                    <p className="text-lg font-bold text-gray-800" dir="ltr">{fmtDuration(filteredTotalWorkedSeconds)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400 mb-1">{t('السجلات المكتملة', 'Completed entries')}</p>
                    <p className="text-lg font-bold text-gray-800">{filteredCompletedCount}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400 mb-1">{t('متوسط السجل', 'Average entry')}</p>
                    <p className="text-lg font-bold text-gray-800" dir="ltr">{fmtDuration(filteredCompletedCount > 0 ? Math.floor(filteredCompletedWorkedSeconds / filteredCompletedCount) : 0)}</p>
                  </div>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FiCalendar size={32} className="mb-3 text-gray-200" />
                <p className="font-medium">{t('لا توجد سجلات حضور', 'No attendance records')}</p>
                <p className="text-xs mt-1 text-gray-300">{isWorker ? t('لم تسجل حضوراً بعد', 'You haven’t checked in yet') : t('سيظهر هنا حضور الموظفين', 'Employee check-ins will appear here')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {!isWorker && <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('الموظف', 'Employee')}</th>}
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('التاريخ', 'Date')}</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('وقت الحضور', 'Arrival')}</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('وقت الانصراف', 'Departure')}</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('مدة الدوام', 'Duration')}</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('الحالة', 'Status')}</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('الطريقة', 'Method')}</th>
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
                        <td className="px-5 py-4 text-sm text-gray-600" dir="ltr">{record.checkOutTime || '--'}</td>
                        <td className="px-5 py-4 text-sm text-gray-600" dir="ltr">{fmtDuration(getDurationSeconds(record))}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold ${record.checkOutTime ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {record.checkOutTime ? t('مكتمل', 'Completed') : t('داخل الدوام', 'Checked in')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold bg-blue-50 text-blue-600">
                            <FiSmartphone size={11} /> QR
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
                <span className="font-bold">{todayAlreadyMarked && !todayHasDeparted ? t('مسح رمز QR للانصراف', 'Scan QR for departure') : t('مسح رمز QR للحضور', 'Scan QR for arrival')}</span>
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
                  <p className="text-xl font-bold text-gray-800">{t('أريج الأقحوان', 'Areej Al Aqhwan')} ✅</p>
                  <p className="text-sm text-emerald-600 font-semibold text-center">
                    {scanAction === 'check_out'
                      ? t('تم تسجيل انصرافك بنجاح', 'Your departure was recorded successfully')
                      : t('تم تسجيل حضورك بنجاح', 'Your arrival was recorded successfully')}
                  </p>
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
                    {t('حاول مرة أخرى', 'Try again')}
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
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#5B7B6D] animate-scanline" />
                        )}
                      </div>
                    </div>
                    {submitting && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 text-center">{todayAlreadyMarked && !todayHasDeparted ? t('وجّه الكاميرا نحو رمز QR اليومي لتسجيل الانصراف', 'Point the camera at today’s QR code to record departure') : t('وجّه الكاميرا نحو رمز QR اليومي لتسجيل الحضور', 'Point the camera at today’s QR code to record arrival')}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
