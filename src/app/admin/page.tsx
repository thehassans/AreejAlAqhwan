'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        toast.success('تم تسجيل الدخول بنجاح');
        router.push('/admin/dashboard');
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
    <div className="min-h-screen bg-gradient-to-br from-[#5B7B6D] to-[#3d5a4e] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
          <h1 className="text-xl font-bold text-gray-800">لوحة التحكم</h1>
          <p className="text-sm text-gray-500 mt-1">تسجيل دخول المسؤول</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
              placeholder="admin@areej.com" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr"
              placeholder="••••••••" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#5B7B6D] text-white rounded-xl font-semibold hover:bg-[#4a6a5c] disabled:opacity-50 transition-colors">
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
