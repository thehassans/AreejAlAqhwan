'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiFileText, FiEye, FiSearch } from 'react-icons/fi';
import SarIcon from '@/components/SarIcon';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  createdAt: string;
}

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()}`;
};

export default function WorkerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json()).then(data => { setInvoices(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = invoices.filter(inv =>
    inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">الفواتير</h1>
          <p className="text-sm text-gray-400 mt-0.5">{invoices.length} فاتورة</p>
        </div>
      </div>
      <div className="relative">
        <FiSearch size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="بحث بالاسم أو رقم الفاتورة..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none bg-gray-50 focus:bg-white transition-all" />
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
          <FiFileText size={32} className="mx-auto mb-3 text-gray-200" />
          <p>لا توجد فواتير</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">رقم الفاتورة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">العميل</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المجموع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">التاريخ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">عرض</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inv => (
                  <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-[#5B7B6D]">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{inv.customerName}</td>
                    <td className="px-4 py-3 text-sm font-bold">
                      <span className="flex items-center gap-1">{inv.total.toFixed(2)} <SarIcon size={12} /></span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(inv.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/dashboard/invoices/${inv._id}`} target="_blank" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg inline-flex" title="عرض الفاتورة">
                        <FiEye size={15} />
                      </Link>
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
