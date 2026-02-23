'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiUpload } from 'react-icons/fi';
import { FaInstagram, FaFacebookF, FaXTwitter, FaPinterestP, FaTiktok, FaSnapchat } from 'react-icons/fa6';
import toast from 'react-hot-toast';

interface Settings {
  storeName: string; storeNameEn: string; storeDescription: string; storeDescriptionEn: string;
  phone: string; email: string; address: string; city: string;
  vatEnabled: boolean; vatPercentage: number; currency: string; defaultLanguage: string;
  logo: string; banner: string;
  instagram: string; instagramEnabled: boolean; facebook: string; facebookEnabled: boolean;
  twitter: string; twitterEnabled: boolean; pinterest: string; pinterestEnabled: boolean;
  tiktok: string; tiktokEnabled: boolean; snapchat: string; snapchatEnabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then(setSettings).catch(console.error);
  }, []);

  const update = (key: keyof Settings, value: Settings[keyof Settings]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
      });
      if (res.ok) toast.success('تم حفظ الإعدادات');
      else toast.error('فشل حفظ الإعدادات');
    } catch { toast.error('حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    if (!e.target.files?.length || !settings) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('folder', 'branding');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) update(field, data.url);
    } catch { toast.error('فشل رفع الصورة'); }
  };

  if (!settings) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">إعدادات المتجر</h1>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 bg-[#5B7B6D] text-white rounded-xl text-sm font-medium hover:bg-[#4a6a5c] disabled:opacity-50">
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">معلومات المتجر</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر (عربي)</label>
            <input type="text" value={settings.storeName} onChange={(e) => update('storeName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر (إنجليزي)</label>
            <input type="text" value={settings.storeNameEn} onChange={(e) => update('storeNameEn', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
            <input type="text" value={settings.phone} onChange={(e) => update('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={settings.email} onChange={(e) => update('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
            <input type="text" value={settings.city} onChange={(e) => update('city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
            <input type="text" value={settings.address} onChange={(e) => update('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">الضريبة واللغة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`relative w-12 h-6 rounded-full transition-colors ${settings.vatEnabled ? 'bg-[#5B7B6D]' : 'bg-gray-300'}`}
                onClick={() => update('vatEnabled', !settings.vatEnabled)}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.vatEnabled ? 'right-0.5' : 'left-0.5'}`} />
              </div>
              <span className="text-sm">ضريبة القيمة المضافة</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الضريبة (%)</label>
            <input type="number" min="0" max="100" value={settings.vatPercentage} onChange={(e) => update('vatPercentage', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اللغة الافتراضية</label>
            <select value={settings.defaultLanguage} onChange={(e) => update('defaultLanguage', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" title="اللغة">
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">الشعار والبانر</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">شعار المتجر</label>
            <div className="flex items-center gap-4">
              {settings.logo && <div className="w-20 h-20 relative rounded-lg overflow-hidden border"><Image src={settings.logo} alt="Logo" fill className="object-cover" /></div>}
              <label className="px-4 py-2 border border-gray-300 rounded-xl text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                <FiUpload size={14} /> رفع شعار
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} className="hidden" />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">بانر المتجر</label>
            <div className="flex items-center gap-4">
              {settings.banner && <div className="w-32 h-20 relative rounded-lg overflow-hidden border"><Image src={settings.banner} alt="Banner" fill className="object-cover" /></div>}
              <label className="px-4 py-2 border border-gray-300 rounded-xl text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                <FiUpload size={14} /> رفع بانر
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">وسائل التواصل الاجتماعي</h2>
        <div className="space-y-4">
          {[
            { key: 'instagram' as keyof Settings, enabledKey: 'instagramEnabled' as keyof Settings, label: 'Instagram', icon: <FaInstagram className="text-pink-600" />, color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400' },
            { key: 'facebook' as keyof Settings, enabledKey: 'facebookEnabled' as keyof Settings, label: 'Facebook', icon: <FaFacebookF className="text-blue-600" />, color: 'bg-blue-600' },
            { key: 'twitter' as keyof Settings, enabledKey: 'twitterEnabled' as keyof Settings, label: 'X (Twitter)', icon: <FaXTwitter className="text-black" />, color: 'bg-black' },
            { key: 'pinterest' as keyof Settings, enabledKey: 'pinterestEnabled' as keyof Settings, label: 'Pinterest', icon: <FaPinterestP className="text-red-600" />, color: 'bg-red-600' },
            { key: 'tiktok' as keyof Settings, enabledKey: 'tiktokEnabled' as keyof Settings, label: 'TikTok', icon: <FaTiktok className="text-black" />, color: 'bg-black' },
            { key: 'snapchat' as keyof Settings, enabledKey: 'snapchatEnabled' as keyof Settings, label: 'Snapchat', icon: <FaSnapchat className="text-yellow-400" />, color: 'bg-yellow-400' },
          ].map((social) => (
            <div key={social.key} className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer min-w-[140px]">
                <div className={`relative w-12 h-6 rounded-full transition-colors ${settings[social.enabledKey] ? 'bg-[#5B7B6D]' : 'bg-gray-300'}`}
                  onClick={() => update(social.enabledKey, !settings[social.enabledKey])}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[social.enabledKey] ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm flex items-center gap-1.5">{social.icon} {social.label}</span>
              </label>
              <input type="text" value={settings[social.key] as string || ''} onChange={(e) => update(social.key, e.target.value)}
                placeholder={`اسم المستخدم أو الرابط`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
