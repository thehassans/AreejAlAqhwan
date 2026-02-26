'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiPrinter, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import SarIcon from '@/components/SarIcon';

interface InvoiceItem {
  name: string;
  nameAr: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyTier: string;
  loyaltyPoints: number;
}

const tierColors: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-700 border-orange-200',
  silver: 'bg-gray-100 text-gray-600 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  platinum: 'bg-purple-100 text-purple-700 border-purple-200',
};
const tierLabels: Record<string, string> = {
  bronze: '🥉 برونزي', silver: '🥈 فضي', gold: '🥇 ذهبي', platinum: '💎 بلاتيني',
};
const tierEmoji: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎',
};

interface SettingsData {
  vatEnabled: boolean;
  vatPercentage: number;
  storeName: string;
  phone: string;
  address: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ name: '', nameAr: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const [notes, setNotes] = useState('');
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((s) => {
      setSettings(s);
      const prefix = s?.invoicePrefix || 'INV';
      const num = s?.invoiceNextNumber || 1;
      setInvoiceNumber(`${prefix}-${String(num).padStart(4, '0')}`);
    }).catch(console.error);
    fetch('/api/customers').then(r => r.json()).then(data => setAllCustomers(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (customerPhone.trim().length < 2) { setPhoneSuggestions([]); setShowSuggestions(false); return; }
    const matches = allCustomers.filter(c => c.phone.includes(customerPhone.trim()) || c.name.toLowerCase().includes(customerPhone.toLowerCase())).slice(0, 5);
    setPhoneSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [customerPhone, allCustomers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (phoneRef.current && !phoneRef.current.contains(e.target as Node)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name); setCustomerPhone(c.phone); setCustomerEmail(c.email || '');
    setSelectedCustomer(c); setShowSuggestions(false);
  };

  const addItem = () => setItems([...items, { name: '', nameAr: '', quantity: 1, unitPrice: 0, total: 0 }]);

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    const item = newItems[index];
    if (field === 'name') item.name = value as string;
    else if (field === 'nameAr') item.nameAr = value as string;
    else if (field === 'quantity') item.quantity = value as number;
    else if (field === 'unitPrice') item.unitPrice = value as number;
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = item.quantity * item.unitPrice;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const vatAmount = settings?.vatEnabled ? (subtotal * (settings.vatPercentage || 15)) / 100 : 0;
  const total = subtotal + vatAmount;

  const handleSave = async (andPrint = false) => {
    if (!customerName.trim()) { toast.error('يرجى إدخال اسم العميل'); return; }
    if (items.some((i) => !i.nameAr && !i.name)) { toast.error('يرجى إدخال اسم المنتج'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber, customerName, customerPhone, customerEmail,
          items, subtotal, discount: 0, discountType: 'fixed',
          vat: settings?.vatPercentage || 0, vatAmount, total, notes,
        }),
      });
      if (res.ok) {
        const inv = await res.json();
        toast.success('تم إنشاء الفاتورة بنجاح');
        if (andPrint) {
          router.push(`/admin/dashboard/invoices/${inv._id}?print=true`);
        } else {
          router.push('/admin/dashboard/invoices');
        }
      } else {
        toast.error('فشل إنشاء الفاتورة');
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800">إنشاء فاتورة جديدة</h1>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">فاتورة رقم: {invoiceNumber}</h2>
        </div>

        {selectedCustomer && (
          <div className={`rounded-xl border p-4 ${tierColors[selectedCustomer.loyaltyTier] || 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tierEmoji[selectedCustomer.loyaltyTier]}</span>
                <div>
                  <p className="font-bold text-sm">عميل {tierLabels[selectedCustomer.loyaltyTier]} — {selectedCustomer.name}</p>
                  <p className="text-xs mt-0.5 opacity-80">{selectedCustomer.totalOrders} طلب سابق · إجمالي الإنفاق: {selectedCustomer.totalSpent.toFixed(2)} ر.س · {selectedCustomer.loyaltyPoints} نقطة ولاء</p>
                </div>
              </div>
              <button onClick={() => { setSelectedCustomer(null); }} className="text-xs underline opacity-60 hover:opacity-100">إلغاء التحديد</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div ref={phoneRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
            <div className="relative">
              <input type="text" value={customerPhone}
                onChange={(e) => { setCustomerPhone(e.target.value); setSelectedCustomer(null); }}
                onFocus={() => phoneSuggestions.length > 0 && setShowSuggestions(true)}
                className="w-full px-4 py-2 pr-9 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" placeholder="05xxxxxxxx" />
              <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {showSuggestions && (
              <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b text-xs text-gray-500 font-medium">عملاء مطابقون</div>
                {phoneSuggestions.map(c => (
                  <button key={c._id} onMouseDown={() => selectCustomer(c)} className="w-full text-right px-3 py-3 hover:bg-[#5B7B6D]/5 transition-colors border-b last:border-0">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-semibold text-gray-800">{c.name}</p><p className="text-xs text-gray-500" dir="ltr">{c.phone}</p></div>
                      <div className="text-left">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium border ${tierColors[c.loyaltyTier]}`}>{tierEmoji[c.loyaltyTier]} {tierLabels[c.loyaltyTier]}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{c.totalOrders} طلب · {c.loyaltyPoints} نقطة</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">المنتجات</h3>
            <button onClick={addItem} className="flex items-center gap-1 text-sm text-[#5B7B6D] hover:underline"><FiPlus size={14} /> إضافة منتج</button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">المنتج (عربي)</label>}
                  <input type="text" value={item.nameAr} onChange={(e) => updateItem(i, 'nameAr', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#5B7B6D] outline-none" />
                </div>
                <div className="col-span-3">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">المنتج (إنجليزي)</label>}
                  <input type="text" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#5B7B6D] outline-none" dir="ltr" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">الكمية</label>}
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#5B7B6D] outline-none" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">السعر</label>}
                  <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#5B7B6D] outline-none" />
                </div>
                <div className="col-span-1 text-center font-bold text-sm py-2">{item.total.toFixed(2)}</div>
                <div className="col-span-1">
                  <button onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" disabled={items.length === 1}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>المجموع الفرعي</span><span className="flex items-center gap-1">{subtotal.toFixed(2)} <SarIcon size={13} /></span></div>
              {settings?.vatEnabled && <div className="flex justify-between"><span>ضريبة ({settings.vatPercentage}%)</span><span className="flex items-center gap-1">{vatAmount.toFixed(2)} <SarIcon size={13} /></span></div>}
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>الإجمالي</span><span className="flex items-center gap-1">{total.toFixed(2)} <SarIcon size={16} /></span></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="px-6 py-2 bg-[#5B7B6D] text-white rounded-xl text-sm font-medium hover:bg-[#4a6a5c] transition-colors disabled:opacity-50">
            {saving ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
            <FiPrinter size={14} /> حفظ وطباعة
          </button>
        </div>
      </div>
    </div>
  );
}
