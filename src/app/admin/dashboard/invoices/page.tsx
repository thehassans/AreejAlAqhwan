'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEye, FiPrinter, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa6';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import SarIcon from '@/components/SarIcon';
import toast from 'react-hot-toast';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/invoices').then((r) => r.json()).then((data) => { setInvoices(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setInvoices(invoices.filter((i) => i._id !== id));
      toast.success('تم حذف الفاتورة');
    } else {
      toast.error('فشل حذف الفاتورة');
    }
  };

  const getWhatsAppUrl = (inv: Invoice) => {
    const msg = [
      `Dear ${inv.customerName},`,
      ``,
      `Thank you for your trust and for choosing "Areej Al-Aqahwan" to be a part of your story. Every flower in our store has been lovingly selected, and every gift carefully packaged to bring joy to you and your loved ones. We hope this arrangement fills your day with beauty and fragrance.`,
      ``,
      `With love,`,
      `The Areej Al-Aqahwan Team 🌷`,
      ``,
      `────────────────`,
      ``,
      `عزيزي/عزيزتي ${inv.customerName}،`,
      ``,
      `نشكركم على ثقتكم واختياركم "أريج الأقهوان" لتكون جزءًا من قصتكم. كل زهرة في متجرنا مختارة بعناية، وكل هدية مُغلفة بحرص لتُضفي البهجة على يومكم ويوم أحبائكم. نتمنى أن تُملأ هذه الباقة يومكم بالجمال والعبير.`,
      ``,
      `مع خالص الحب،`,
      `فريق أريج الأقهوان 🌷`,
      ``,
      `────────────────`,
      `فاتورة رقم: ${inv.invoiceNumber}`,
      `الإجمالي: ${inv.total} ر.س`,
    ].join('\n');
    let phone = (inv.customerPhone || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '966' + phone.slice(1);
    return phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">الفواتير</h1>
        <Link href="/admin/dashboard/invoices/create" className="flex items-center gap-2 px-4 py-2 bg-[#5B7B6D] text-white rounded-xl text-sm font-medium hover:bg-[#4a6a5c] transition-colors">
          <FiPlus size={16} /> إنشاء فاتورة
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          <p className="text-lg">لا توجد فواتير بعد</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">رقم الفاتورة</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">العميل</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">المجموع</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">التاريخ</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm">{inv.customerName}</td>
                    <td className="px-4 py-3 text-sm font-bold"><span className="flex items-center gap-1">{formatCurrency(inv.total)} <SarIcon size={12} /></span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateShort(inv.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/dashboard/invoices/${inv._id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="عرض"><FiEye size={16} /></Link>
                        <Link href={`/admin/dashboard/invoices/${inv._id}?print=true`} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="طباعة"><FiPrinter size={16} /></Link>
                        <a href={getWhatsAppUrl(inv)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="واتساب"><FaWhatsapp size={16} /></a>
                        <button onClick={() => handleDelete(inv._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="حذف"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
