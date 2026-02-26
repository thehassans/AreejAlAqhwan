'use client';

import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

export default function ScanAttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    fetch('/api/worker-auth/check')
      .then(r => r.json())
      .then(data => { if (data.worker?.id) setWorkerId(data.worker.id); })
      .catch(() => {});
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  useEffect(() => { return () => stopCamera(); }, []);

  const startScanning = async () => {
    setScanState('scanning');
    setCameraError('');
    setResultMessage('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      scanLoop();
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('تعذّر الوصول إلى الكاميرا. تأكد من منح الإذن.');
      setScanState('idle');
    }
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || isProcessing) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    if (video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    import('jsqr').then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code && code.data && code.data.startsWith('AREEJ-ATT-')) {
        handleQRDetected(code.data);
      } else {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    }).catch(() => {
      animFrameRef.current = requestAnimationFrame(scanLoop);
    });
  };

  const handleQRDetected = async (qrData: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    stopCamera();

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, qrValue: qrData, method: 'qr' }),
      });
      const data = await res.json();

      if (res.ok) {
        setScanState('success');
        setResultMessage(`تم تسجيل حضورك بنجاح في ${data.checkInTime}`);
        toast.success('تم تسجيل الحضور ✅');
      } else {
        setScanState('error');
        setResultMessage(data.error || 'فشل تسجيل الحضور');
        toast.error(data.error || 'فشل تسجيل الحضور');
      }
    } catch {
      setScanState('error');
      setResultMessage('حدث خطأ في الاتصال');
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    stopCamera();
    setScanState('idle');
    setResultMessage('');
    setCameraError('');
    setIsProcessing(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">تسجيل الحضور</h1>
        <p className="text-sm text-gray-500 mt-0.5">{today}</p>
      </div>

      {/* Scanner Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Camera Viewport */}
        <div className="relative bg-gray-900" style={{ aspectRatio: '1/1' }}>
          {/* Video */}
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${scanState === 'scanning' ? 'opacity-100' : 'opacity-0'}`}
            playsInline
            muted
          />

          {/* Hidden canvas for QR processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Idle State */}
          {scanState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-[#2C3E35] text-white">
              <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mb-4">
                <FiCamera size={36} className="text-white/80" />
              </div>
              <p className="text-base font-semibold">الكاميرا متوقفة</p>
              <p className="text-xs text-white/50 mt-1 text-center px-8">اضغط زر المسح أدناه لتشغيل الكاميرا</p>
            </div>
          )}

          {/* Scanning Overlay */}
          {scanState === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Dimmed corners */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Scan frame */}
              <div className="relative z-10 w-56 h-56">
                {/* Corners */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                {/* Scan line */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400 opacity-80 animate-[scan_2s_ease-in-out_infinite]" style={{ animation: 'scanline 2s ease-in-out infinite' }} />
              </div>
              {/* Hint text */}
              <div className="absolute bottom-6 inset-x-0 flex justify-center">
                <span className="bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm">
                  وجّه الكاميرا نحو رمز QR
                </span>
              </div>
            </div>
          )}

          {/* Success State */}
          {scanState === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 to-emerald-700 text-white">
              <div className="w-24 h-24 rounded-full bg-emerald-400/20 flex items-center justify-center mb-4 animate-bounce" style={{ animation: 'none' }}>
                <FiCheckCircle size={52} className="text-emerald-300" />
              </div>
              <p className="text-xl font-bold">تم بنجاح! ✅</p>
              <p className="text-sm text-emerald-200 mt-2 text-center px-8">{resultMessage}</p>
            </div>
          )}

          {/* Error State */}
          {scanState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-950 to-red-800 text-white">
              <div className="w-24 h-24 rounded-full bg-red-400/20 flex items-center justify-center mb-4">
                <FiAlertCircle size={52} className="text-red-300" />
              </div>
              <p className="text-xl font-bold">فشل التسجيل</p>
              <p className="text-sm text-red-200 mt-2 text-center px-8">{resultMessage}</p>
            </div>
          )}

          {/* Stop button */}
          {scanState === 'scanning' && (
            <button
              onClick={reset}
              className="absolute top-3 left-3 z-20 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
              aria-label="إيقاف المسح"
            >
              <FiX size={18} />
            </button>
          )}
        </div>

        {/* Camera Error */}
        {cameraError && (
          <div className="px-5 py-3 bg-red-50 border-t border-red-100 text-red-600 text-sm flex items-center gap-2">
            <FiAlertCircle size={16} />
            {cameraError}
          </div>
        )}

        {/* Bottom Controls */}
        <div className="p-5 space-y-3">
          {(scanState === 'idle' || scanState === 'scanning') && (
            <button
              onClick={scanState === 'scanning' ? reset : startScanning}
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                scanState === 'scanning'
                  ? 'bg-red-50 text-red-600 border-2 border-red-200 shadow-none'
                  : 'bg-[#5B7B6D] text-white shadow-[#5B7B6D]/30 hover:bg-[#4a6a5c] active:scale-95'
              }`}
            >
              {scanState === 'scanning' ? (
                <>
                  <FiX size={18} />
                  إيقاف المسح
                </>
              ) : (
                <>
                  <FiCamera size={20} />
                  ابدأ مسح QR
                </>
              )}
            </button>
          )}

          {(scanState === 'success' || scanState === 'error') && (
            <button
              onClick={reset}
              className="w-full py-4 rounded-2xl font-bold text-base bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <FiRefreshCw size={18} />
              مسح مرة أخرى
            </button>
          )}

          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600">كيفية تسجيل الحضور:</p>
            <ol className="text-xs text-gray-500 space-y-1 list-none">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 bg-[#5B7B6D]/10 text-[#5B7B6D] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">١</span>
                اضغط على "ابدأ مسح QR"
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 bg-[#5B7B6D]/10 text-[#5B7B6D] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">٢</span>
                وجّه الكاميرا نحو رمز QR في لوحة الإدارة
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 bg-[#5B7B6D]/10 text-[#5B7B6D] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">٣</span>
                سيتم تسجيل حضورك تلقائياً عند القراءة
              </li>
            </ol>
          </div>

          <p className="text-xs text-center text-gray-400">
            رمز QR اليومي يتغير كل يوم — تأكد من مسح الرمز الصحيح
          </p>
        </div>
      </div>
    </div>
  );
}
