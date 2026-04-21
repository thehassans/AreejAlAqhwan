'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useT } from '@/lib/i18n';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useT();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('تم تسجيل الدخول بنجاح', 'Signed in successfully'));
        router.push('/admin/dashboard');
      } else {
        toast.error(data.error || t('فشل تسجيل الدخول', 'Sign-in failed'));
      }
    } catch {
      toast.error(t('حدث خطأ في الاتصال', 'Connection error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5B7B6D] to-[#3d5a4e] flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4"><LanguageSwitcher variant="dark" /></div>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
          <h1 className="text-xl font-bold text-gray-800">{t('لوحة التحكم', 'Control Panel')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('تسجيل دخول المسؤول', 'Admin Sign-in')}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
              placeholder="admin@areej.com" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('كلمة المرور', 'Password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('إخفاء كلمة المرور', 'Hide password') : t('إظهار كلمة المرور', 'Show password')}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#5B7B6D] text-white rounded-xl font-semibold hover:bg-[#4a6a5c] disabled:opacity-50 transition-colors">
            {loading ? t('جاري الدخول...', 'Signing in...') : t('تسجيل الدخول', 'Sign in')}
          </button>
        </form>
      </div>
    </div>
  );
}
