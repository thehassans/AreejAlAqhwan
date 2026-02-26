'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function WorkerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/worker-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`أهلاً ${data.worker.name} 👋`);
        router.push('/worker/dashboard');
      } else {
        toast.error(data.error || 'فشل تسجيل الدخول');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C3E35] via-[#3d5a4e] to-[#5B7B6D] flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg ring-4 ring-[#5B7B6D]/10">
              <Image src="/logo.png" alt="Logo" width={80} height={80} className="object-cover w-full h-full" unoptimized />
            </div>
            <h1 className="text-xl font-bold text-gray-800">لوحة الموظف</h1>
            <p className="text-sm text-gray-400 mt-1">أريج الأخوان</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <FiMail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  placeholder="worker@areej.com"
                  required
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <FiLock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  placeholder="••••••••"
                  required
                  className="w-full pr-10 pl-10 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#5B7B6D] to-[#4a6a5c] text-white rounded-2xl font-bold text-sm hover:from-[#4a6a5c] hover:to-[#3d5a4e] disabled:opacity-50 transition-all shadow-lg shadow-[#5B7B6D]/30 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  جاري الدخول...
                </span>
              ) : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            لوحة تحكم الموظفين — أريج الأخوان 🌸
          </p>
        </div>

        {/* Admin link */}
        <p className="text-center mt-4">
          <a href="/admin" className="text-white/60 text-xs hover:text-white transition-colors">
            تسجيل دخول المسؤول ←
          </a>
        </p>
      </div>
    </div>
  );
}
