'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiUpload, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';
import { FaInstagram, FaFacebookF, FaXTwitter, FaPinterestP, FaTiktok, FaSnapchat } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

interface Settings {
  storeName: string; storeNameEn: string; storeDescription: string; storeDescriptionEn: string;
  phone: string; email: string; address: string; city: string;
  vatEnabled: boolean; vatPercentage: number; currency: string; defaultLanguage: string;
  logo: string; banner: string;
  invoicePrefix: string; invoiceNextNumber: number;
  invoiceWhatsappMessage: string;
  instagram: string; instagramEnabled: boolean; facebook: string; facebookEnabled: boolean;
  twitter: string; twitterEnabled: boolean; pinterest: string; pinterestEnabled: boolean;
  tiktok: string; tiktokEnabled: boolean; snapchat: string; snapchatEnabled: boolean;
}

export default function SettingsPage() {
  const t = useT();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  // Change password state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  // Clear data state
  const [clearing, setClearing] = useState<string | null>(null);

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
      if (res.ok) toast.success(t('تم حفظ الإعدادات', 'Settings saved'));
      else toast.error(t('فشل حفظ الإعدادات', 'Failed to save settings'));
    } catch { toast.error(t('حدث خطأ', 'An error occurred')); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) return toast.error(t('جميع الحقول مطلوبة', 'All fields are required'));
    if (pwForm.next !== pwForm.confirm) return toast.error(t('كلمتا المرور الجديدتان غير متطابقتين', 'New passwords do not match'));
    if (pwForm.next.length < 6) return toast.error(t('كلمة المرور الجديدة 6 أحرف على الأقل', 'New password must be at least 6 characters'));
    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(t('تم تغيير كلمة المرور', 'Password changed')); setPwForm({ current: '', next: '', confirm: '' }); }
      else toast.error(data.error || t('فشل تغيير كلمة المرور', 'Failed to change password'));
    } catch { toast.error(t('حدث خطأ', 'An error occurred')); }
    finally { setPwSaving(false); }
  };

  const handleClear = async (collection: string, label: string) => {
    if (!confirm(t(`هل أنت متأكد من حذف جميع ${label}؟ هذا الإجراء لا يمكن التراجع عنه.`, `Delete all ${label}? This action cannot be undone.`))) return;
    setClearing(collection);
    try {
      const res = await fetch('/api/admin/clear', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection }),
      });
      const data = await res.json();
      if (res.ok) toast.success(t(`تم حذف ${data.deleted} ${label}`, `Deleted ${data.deleted} ${label}`));
      else toast.error(data.error || t('فشل الحذف', 'Delete failed'));
    } catch { toast.error(t('حدث خطأ', 'An error occurred')); }
    finally { setClearing(null); }
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
    } catch { toast.error(t('فشل رفع الصورة', 'Image upload failed')); }
  };

  if (!settings) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('إعدادات المتجر', 'Store Settings')}</h1>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 bg-[#5B7B6D] text-white rounded-xl text-sm font-medium hover:bg-[#4a6a5c] disabled:opacity-50">
          {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ الإعدادات', 'Save settings')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{t('معلومات المتجر', 'Store Info')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('اسم المتجر (عربي)', 'Store name (Arabic)')}</label>
            <input type="text" value={settings.storeName} onChange={(e) => update('storeName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('اسم المتجر (إنجليزي)', 'Store name (English)')}</label>
            <input type="text" value={settings.storeNameEn} onChange={(e) => update('storeNameEn', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('الهاتف', 'Phone')}</label>
            <input type="text" value={settings.phone} onChange={(e) => update('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
            <input type="email" value={settings.email} onChange={(e) => update('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('المدينة', 'City')}</label>
            <input type="text" value={settings.city} onChange={(e) => update('city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('العنوان', 'Address')}</label>
            <input type="text" value={settings.address} onChange={(e) => update('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{t('الضريبة واللغة', 'Tax & Language')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`relative w-12 h-6 rounded-full transition-colors ${settings.vatEnabled ? 'bg-[#5B7B6D]' : 'bg-gray-300'}`}
                onClick={() => update('vatEnabled', !settings.vatEnabled)}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.vatEnabled ? 'right-0.5' : 'left-0.5'}`} />
              </div>
              <span className="text-sm">{t('ضريبة القيمة المضافة', 'Value Added Tax')}</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('نسبة الضريبة (%)', 'Tax rate (%)')}</label>
            <input type="number" min="0" max="100" value={settings.vatPercentage} onChange={(e) => update('vatPercentage', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('اللغة الافتراضية', 'Default language')}</label>
            <select value={settings.defaultLanguage} onChange={(e) => update('defaultLanguage', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" title={t('اللغة', 'Language')}>
              <option value="ar">{t('العربية', 'Arabic')}</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{t('إعدادات الفواتير', 'Invoice Settings')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('بادئة الفاتورة (مثال: INV, فاتورة)', 'Invoice prefix (e.g. INV)')}</label>
            <input type="text" value={settings.invoicePrefix || 'INV'} onChange={(e) => update('invoicePrefix', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('رقم الفاتورة التالي', 'Next invoice number')}</label>
            <input type="number" min="1" value={settings.invoiceNextNumber || 1} onChange={(e) => update('invoiceNextNumber', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
        </div>
        <p className="text-xs text-gray-400">{t('مثال', 'Example')}: {settings.invoicePrefix || 'INV'}-{String(settings.invoiceNextNumber || 1).padStart(4, '0')}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('رسالة واتساب التلقائية للفواتير', 'Automatic WhatsApp invoice message')}</label>
          <textarea
            value={settings.invoiceWhatsappMessage || ''}
            onChange={(e) => update('invoiceWhatsappMessage', e.target.value)}
            rows={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm"
            dir="auto"
          />
          <p className="text-xs text-gray-400 mt-2" dir="ltr">{t('يمكنك استخدام', 'You can use')}: {`{customerName} {invoiceNumber} {date} {items} {discountLine} {vatLine} {total} {storeName} {storeNameEn}`}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{t('الشعار والبانر', 'Logo & Banner')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('شعار المتجر', 'Store logo')}</label>
            <div className="flex items-center gap-4">
              {settings.logo && <div className="w-20 h-20 relative rounded-lg overflow-hidden border"><Image src={settings.logo} alt="Logo" fill className="object-cover" /></div>}
              <label className="px-4 py-2 border border-gray-300 rounded-xl text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                <FiUpload size={14} /> {t('رفع شعار', 'Upload logo')}
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} className="hidden" />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('بانر المتجر', 'Store banner')}</label>
            <div className="flex items-center gap-4">
              {settings.banner && <div className="w-32 h-20 relative rounded-lg overflow-hidden border"><Image src={settings.banner} alt="Banner" fill className="object-cover" /></div>}
              <label className="px-4 py-2 border border-gray-300 rounded-xl text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                <FiUpload size={14} /> {t('رفع بانر', 'Upload banner')}
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{t('تغيير كلمة المرور', 'Change Password')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['current', 'next', 'confirm'] as const).map((field) => {
            const labels = {
              current: t('كلمة المرور الحالية', 'Current password'),
              next: t('كلمة المرور الجديدة', 'New password'),
              confirm: t('تأكيد كلمة المرور الجديدة', 'Confirm new password'),
            };
            return (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels[field]}</label>
                <div className="relative">
                  <input type={showPw[field] ? 'text' : 'password'} value={pwForm[field]}
                    onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm pr-10" dir="ltr" />
                  <button type="button" onClick={() => setShowPw({ ...showPw, [field]: !showPw[field] })}
                    className="absolute inset-y-0 right-2 flex items-center px-1 text-gray-400 hover:text-gray-600">
                    {showPw[field] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={handleChangePassword} disabled={pwSaving}
          className="px-6 py-2 bg-[#5B7B6D] text-white rounded-xl text-sm font-medium hover:bg-[#4a6a5c] disabled:opacity-50">
          {pwSaving ? t('جاري التغيير...', 'Changing...') : t('تغيير كلمة المرور', 'Change password')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-red-500" size={20} />
          <h2 className="text-lg font-bold text-red-600">{t('منطقة الخطر', 'Danger Zone')}</h2>
        </div>
        <p className="text-sm text-gray-500">{t('هذه الإجراءات لا يمكن التراجع عنها. تأكد قبل المتابعة.', 'These actions cannot be undone. Be sure before continuing.')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { collection: 'invoices', label: t('الفواتير', 'invoices'), desc: t('حذف جميع الفواتير من قاعدة البيانات', 'Delete all invoices from the database') },
            { collection: 'orders', label: t('الطلبات', 'orders'), desc: t('حذف جميع الطلبات من قاعدة البيانات', 'Delete all orders from the database') },
            { collection: 'customers', label: t('العملاء', 'customers'), desc: t('حذف جميع العملاء من قاعدة البيانات', 'Delete all customers from the database') },
          ].map(({ collection, label, desc }) => (  
            <div key={collection} className="border border-red-100 rounded-xl p-4 bg-red-50">
              <p className="font-semibold text-gray-800 text-sm mb-1">{t('مسح', 'Clear')} {label}</p>
              <p className="text-xs text-gray-500 mb-3">{desc}</p>
              <button onClick={() => handleClear(collection, label)} disabled={clearing === collection}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {clearing === collection ? t('جاري الحذف...', 'Deleting...') : t(`حذف كل ${label}`, `Delete all ${label}`)}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{t('وسائل التواصل الاجتماعي', 'Social Media')}</h2>
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
                placeholder={t('اسم المستخدم أو الرابط', 'Username or URL')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
