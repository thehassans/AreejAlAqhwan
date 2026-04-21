'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import SarIcon from '@/components/SarIcon';
import { FiSearch } from 'react-icons/fi';
import { useT } from '@/lib/i18n';

interface Customer {
  _id: string; name: string; phone: string; email: string; city: string;
  totalOrders: number; totalSpent: number; loyaltyTier: string; loyaltyPoints: number;
}

const tierColors: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-700',
  silver: 'bg-gray-200 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-700',
  platinum: 'bg-purple-100 text-purple-700',
};
const tierLabels: Record<string, { ar: string; en: string }> = {
  bronze: { ar: 'برونزي', en: 'Bronze' },
  silver: { ar: 'فضي', en: 'Silver' },
  gold: { ar: 'ذهبي', en: 'Gold' },
  platinum: { ar: 'بلاتيني', en: 'Platinum' },
};

export default function CustomersPage() {
  const t = useT();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/customers').then((r) => r.json()).then((data) => { setCustomers(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const tierCounts = customers.reduce((acc, c) => {
    acc[c.loyaltyTier] = (acc[c.loyaltyTier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('العملاء وبرنامج الولاء', 'Customers & Loyalty')}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => (
          <div key={tier} className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${tierColors[tier]}`}>{t(tierLabels[tier].ar, tierLabels[tier].en)}</span>
            <p className="text-2xl font-bold mt-2">{tierCounts[tier] || 0}</p>
            <p className="text-xs text-gray-500">{t('عميل', 'customer')}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder={t('بحث بالاسم أو رقم الجوال...', 'Search by name or phone...')} value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400"><p>{t('لا يوجد عملاء', 'No customers')}</p></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">{t('العميل', 'Customer')}</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">{t('الجوال', 'Phone')}</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">{t('المدينة', 'City')}</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">{t('الطلبات', 'Orders')}</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">{t('إجمالي الإنفاق', 'Total spent')}</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">{t('النقاط', 'Points')}</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">{t('المستوى', 'Tier')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500" dir="ltr">{c.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.city || '-'}</td>
                    <td className="px-4 py-3 text-sm">{c.totalOrders}</td>
                    <td className="px-4 py-3 text-sm font-bold"><span className="flex items-center gap-1">{formatCurrency(c.totalSpent)} <SarIcon size={12} /></span></td>
                    <td className="px-4 py-3 text-sm">{c.loyaltyPoints}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${tierColors[c.loyaltyTier]}`}>{tierLabels[c.loyaltyTier] ? t(tierLabels[c.loyaltyTier].ar, tierLabels[c.loyaltyTier].en) : c.loyaltyTier}</span>
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
