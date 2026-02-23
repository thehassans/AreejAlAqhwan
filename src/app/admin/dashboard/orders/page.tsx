'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import SarIcon from '@/components/SarIcon';
import toast from 'react-hot-toast';

interface OrderItem { name: string; nameAr: string; price: number; quantity: number; image: string }
interface Order {
  _id: string; orderNumber: string; items: OrderItem[]; total: number;
  status: string; customer: { name: string; phone: string; city: string; address: string; notes: string }; createdAt: string;
}

const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusLabels: Record<string, string> = { all: 'الكل', pending: 'قيد الانتظار', confirmed: 'مؤكد', processing: 'قيد التجهيز', shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغي' };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    fetch('/api/orders').then((r) => r.json()).then((data) => { setOrders(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders(orders.map((o) => o._id === id ? { ...o, status } : o));
      if (selected?._id === id) setSelected({ ...selected, status });
      toast.success('تم تحديث الحالة');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">الطلبات الإلكترونية</h1>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-[#5B7B6D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400"><p>لا توجد طلبات</p></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">رقم الطلب</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">العميل</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">المجموع</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الحالة</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">التاريخ</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm">{order.customer.name}</td>
                    <td className="px-4 py-3 text-sm font-bold"><span className="flex items-center gap-1">{formatCurrency(order.total)} <SarIcon size={12} /></span></td>
                    <td className="px-4 py-3">
                      <select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(order.status)}`} title="تحديث الحالة">
                        {statuses.filter((s) => s !== 'all').map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateShort(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(order)} className="text-sm text-[#5B7B6D] hover:underline">التفاصيل</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 left-0 w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">طلب {selected.orderNumber}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-sm mb-2">معلومات العميل</h3>
                <p className="text-sm">{selected.customer.name}</p>
                <p className="text-sm text-gray-500">{selected.customer.phone}</p>
                {selected.customer.city && <p className="text-sm text-gray-500">{selected.customer.city}</p>}
                {selected.customer.address && <p className="text-sm text-gray-500">{selected.customer.address}</p>}
                {selected.customer.notes && <p className="text-sm text-gray-500 mt-1">ملاحظات: {selected.customer.notes}</p>}
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2">المنتجات</h3>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <span>{item.nameAr || item.name} × {item.quantity}</span>
                      <span className="font-bold flex items-center gap-1">{formatCurrency(item.price * item.quantity)} <SarIcon size={11} /></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>الإجمالي</span>
                <span className="flex items-center gap-1">{formatCurrency(selected.total)} <SarIcon size={14} /></span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تحديث الحالة</label>
                <select value={selected.status} onChange={(e) => updateStatus(selected._id, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm" title="تحديث الحالة">
                  {statuses.filter((s) => s !== 'all').map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-400">تاريخ الطلب: {formatDateShort(selected.createdAt)}</p>
              <span className={`inline-block text-xs px-3 py-1 rounded-full ${getStatusColor(selected.status)}`}>{getStatusLabel(selected.status)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
