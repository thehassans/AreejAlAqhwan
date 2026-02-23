'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';
import { translations } from '@/i18n/translations';
import toast from 'react-hot-toast';
import SarIcon from '@/components/SarIcon';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { locale } = useLanguageStore();
  const t = translations[locale].checkout;
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vatPercentage, setVatPercentage] = useState(15);
  const [vatEnabled, setVatEnabled] = useState(true);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: '', address: '', notes: '',
  });

  useEffect(() => {
    setMounted(true);
    fetch('/api/settings').then((r) => r.json()).then((s) => {
      setVatPercentage(s.vatPercentage || 15);
      setVatEnabled(s.vatEnabled ?? true);
    }).catch(() => {});
  }, []);

  const updateForm = (field: string, value: string) => setForm({ ...form, [field]: value });

  const subtotal = getTotal();
  const vatAmount = vatEnabled ? (subtotal * vatPercentage) / 100 : 0;
  const total = subtotal + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { toast.error('يرجى إدخال الاسم ورقم الجوال'); return; }
    if (items.length === 0) { toast.error('السلة فارغة'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.id, name: i.name, nameAr: i.nameAr, price: i.price, quantity: i.quantity, image: i.image,
          })),
          subtotal, vat: vatAmount, total,
          customer: form,
          paymentMethod: 'cod',
        }),
      });
      if (res.ok) {
        const order = await res.json();
        clearCart();
        router.push(`/thank-you?order=${order.orderNumber}`);
      } else { toast.error('فشل إنشاء الطلب'); }
    } catch { toast.error('حدث خطأ'); }
    finally { setSubmitting(false); }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-400">السلة فارغة</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t.title}</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t.customerInfo}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.name} *</label>
                  <input type="text" required value={form.name} onChange={(e) => updateForm('name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone} *</label>
                  <input type="tel" required value={form.phone} onChange={(e) => updateForm('phone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                  <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.city}</label>
                  <input type="text" value={form.city} onChange={(e) => updateForm('city', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
                  <input type="text" value={form.address} onChange={(e) => updateForm('address', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
                  <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-20">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t.orderSummary}</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={item.image || '/logo.png'} alt={item.nameAr} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{locale === 'ar' ? item.nameAr : item.name}</p>
                      <p className="text-xs text-gray-500">×{item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold">{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between"><span>{t.subtotal}</span><span className="flex items-center gap-1">{subtotal.toFixed(2)} <SarIcon size={13} /></span></div>
                {vatEnabled && <div className="flex justify-between"><span>{t.vat} ({vatPercentage}%)</span><span className="flex items-center gap-1">{vatAmount.toFixed(2)} <SarIcon size={13} /></span></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>{t.total}</span><span className="text-[#5B7B6D] flex items-center gap-1">{total.toFixed(2)} <SarIcon size={16} /></span></div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full mt-4 py-3 bg-[#5B7B6D] text-white rounded-xl font-bold hover:bg-[#4a6a5c] disabled:opacity-50 transition-colors">
                {submitting ? t.processing : t.placeOrder}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
