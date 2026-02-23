'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiShoppingCart, FiPackage, FiUsers, FiFileText, FiDollarSign } from 'react-icons/fi';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import SarIcon from '@/components/SarIcon';

interface DashboardData {
  stats: { totalOrders: number; totalProducts: number; totalCustomers: number; totalInvoices: number; totalRevenue: number };
  recentOrders: Array<{ _id: string; orderNumber: string; customer: { name: string }; total: number; status: string; createdAt: string }>;
  recentInvoices: Array<{ _id: string; invoiceNumber: string; customerName: string; total: number; createdAt: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;
  }

  const statCards = [
    { label: 'إجمالي الطلبات', value: data.stats.totalOrders, icon: FiShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'المنتجات', value: data.stats.totalProducts, icon: FiPackage, color: 'bg-green-50 text-green-600' },
    { label: 'العملاء', value: data.stats.totalCustomers, icon: FiUsers, color: 'bg-purple-50 text-purple-600' },
    { label: 'الفواتير', value: data.stats.totalInvoices, icon: FiFileText, color: 'bg-orange-50 text-orange-600' },
    { label: 'إجمالي الإيرادات', value: formatCurrency(data.stats.totalRevenue), icon: FiDollarSign, color: 'bg-emerald-50 text-emerald-600', isCurrency: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color} mb-3`}>
              <card.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800 flex items-center gap-1">{card.value} {(card as any).isCurrency && <SarIcon size={20} />}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">آخر الطلبات</h2>
            <Link href="/admin/dashboard/orders" className="text-sm text-[#5B7B6D] hover:underline">عرض الكل</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">لا توجد طلبات</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.customer.name} • {formatDateShort(order.createdAt)}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm flex items-center gap-1">{formatCurrency(order.total)} <SarIcon size={12} /></p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">آخر الفواتير</h2>
            <Link href="/admin/dashboard/invoices" className="text-sm text-[#5B7B6D] hover:underline">عرض الكل</Link>
          </div>
          {data.recentInvoices.length === 0 ? (
            <p className="text-gray-400 text-center py-8">لا توجد فواتير</p>
          ) : (
            <div className="space-y-3">
              {data.recentInvoices.map((inv) => (
                <div key={inv._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{inv.customerName} • {formatDateShort(inv.createdAt)}</p>
                  </div>
                  <p className="font-bold text-sm flex items-center gap-1">{formatCurrency(inv.total)} <SarIcon size={12} /></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
