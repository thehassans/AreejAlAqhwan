'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiPrinter } from 'react-icons/fi';
import { generateInvoiceNumber } from '@/lib/utils';
import toast from 'react-hot-toast';
import SarIcon from '@/components/SarIcon';

interface InvoiceItem {
  name: string;
  nameAr: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SettingsData {
  vatEnabled: boolean;
  vatPercentage: number;
  storeName: string;
  phone: string;
  address: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [invoiceNumber] = useState(generateInvoiceNumber());
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ name: '', nameAr: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [notes, setNotes] = useState('');
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then(setSettings).catch(console.error);
  }, []);

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
  const discountAmount = discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = settings?.vatEnabled ? (afterDiscount * (settings.vatPercentage || 15)) / 100 : 0;
  const total = afterDiscount + vatAmount;

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
          items, subtotal, discount, discountType,
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
            <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
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
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 min-w-[80px]">الخصم</label>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#5B7B6D] outline-none" />
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="fixed">ر.س</option>
                <option value="percentage">%</option>
              </select>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>المجموع الفرعي</span><span className="flex items-center gap-1">{subtotal.toFixed(2)} <SarIcon size={13} /></span></div>
              {discountAmount > 0 && <div className="flex justify-between text-red-600"><span>الخصم</span><span className="flex items-center gap-1">-{discountAmount.toFixed(2)} <SarIcon size={13} /></span></div>}
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
