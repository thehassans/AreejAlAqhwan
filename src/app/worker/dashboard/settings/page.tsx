'use client';

import { useEffect, useState } from 'react';
import { FiSettings, FiInfo } from 'react-icons/fi';

interface SettingsData {
  storeName: string;
  phone: string;
  address: string;
  vatEnabled: boolean;
  vatPercentage: number;
}

export default function WorkerSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => { setSettings(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-gray-800">معلومات المتجر</h1>
        <p className="text-sm text-gray-400 mt-0.5">بيانات المتجر الأساسية</p>
      </div>

      <div className="bg-[#5B7B6D]/5 border border-[#5B7B6D]/10 rounded-2xl p-4 flex items-start gap-3">
        <FiInfo size={16} className="text-[#5B7B6D] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#5B7B6D]">هذه الصفحة للعرض فقط. لتعديل الإعدادات يرجى التواصل مع المسؤول.</p>
      </div>

      {settings && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center gap-2"><FiSettings size={14} /> اسم المتجر</span>
            <span className="text-sm font-semibold text-gray-800">{settings.storeName || '—'}</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">رقم الهاتف</span>
            <span className="text-sm font-semibold text-gray-800" dir="ltr">{settings.phone || '—'}</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">العنوان</span>
            <span className="text-sm font-semibold text-gray-800">{settings.address || '—'}</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">ضريبة القيمة المضافة</span>
            <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${settings.vatEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
              {settings.vatEnabled ? `${settings.vatPercentage}% مفعّلة` : 'غير مفعّلة'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
