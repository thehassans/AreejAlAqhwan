'use client';

import { useEffect, useState } from 'react';
import { FiShoppingCart, FiSearch } from 'react-icons/fi';
import SarIcon from '@/components/SarIcon';
import { useT } from '@/lib/i18n';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};
const statusLabelsMap: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  processing: { ar: 'قيد التنفيذ', en: 'Processing' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()}`;
};

export default function WorkerOrdersPage() {
  const t = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o =>
    (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.orderNumber || '').includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{t('الطلبات', 'Orders')}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{orders.length} {t('طلب', 'order(s)')}</p>
      </div>
      <div className="relative">
        <FiSearch size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder={t('بحث في الطلبات...', 'Search orders...')} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none bg-gray-50 focus:bg-white transition-all" />
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
          <FiShoppingCart size={32} className="mx-auto mb-3 text-gray-200" />
          <p>{t('لا توجد طلبات', 'No orders')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">{order.customerName}</p>
                  <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{order.orderNumber}</p>
                </div>
                <div className="text-left space-y-1">
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium block text-center ${statusColors[order.status] || 'bg-gray-50 text-gray-500'}`}>
                    {statusLabelsMap[order.status] ? t(statusLabelsMap[order.status].ar, statusLabelsMap[order.status].en) : order.status}
                  </span>
                  <span className="flex items-center gap-0.5 text-sm font-bold text-[#5B7B6D] justify-end">
                    {(order.total || 0).toFixed(2)} <SarIcon size={11} />
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{fmtDate(order.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
