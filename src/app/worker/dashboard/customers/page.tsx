'use client';

import { useEffect, useState } from 'react';
import { FiUsers, FiSearch, FiPhone, FiMail } from 'react-icons/fi';
import SarIcon from '@/components/SarIcon';
import { useT } from '@/lib/i18n';

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
  bronze: 'bg-orange-50 text-orange-700',
  silver: 'bg-gray-100 text-gray-600',
  gold: 'bg-yellow-50 text-yellow-700',
  platinum: 'bg-purple-50 text-purple-700',
};
const tierEmoji: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
const tierLabelsMap: Record<string, { ar: string; en: string }> = {
  bronze: { ar: 'برونزي', en: 'Bronze' },
  silver: { ar: 'فضي', en: 'Silver' },
  gold: { ar: 'ذهبي', en: 'Gold' },
  platinum: { ar: 'بلاتيني', en: 'Platinum' },
};

export default function WorkerCustomersPage() {
  const t = useT();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(data => { setCustomers(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{t('العملاء', 'Customers')}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{customers.length} {t('عميل', 'customer(s)')}</p>
      </div>
      <div className="relative">
        <FiSearch size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder={t('بحث بالاسم أو رقم الجوال...', 'Search by name or phone...')} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none bg-gray-50 focus:bg-white transition-all" />
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
          <FiUsers size={32} className="mx-auto mb-3 text-gray-200" />
          <p>{t('لا يوجد عملاء', 'No customers')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(customer => (
            <div key={customer._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#5B7B6D]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-[#5B7B6D] font-bold">{customer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{customer.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${tierColors[customer.loyaltyTier] || 'bg-gray-50 text-gray-500'}`}>
                      {tierEmoji[customer.loyaltyTier]} {tierLabelsMap[customer.loyaltyTier] ? t(tierLabelsMap[customer.loyaltyTier].ar, tierLabelsMap[customer.loyaltyTier].en) : customer.loyaltyTier}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-[#5B7B6D] flex items-center gap-0.5 justify-end">
                    {customer.totalSpent.toFixed(2)} <SarIcon size={11} />
                  </p>
                  <p className="text-xs text-gray-400">{customer.totalOrders} {t('طلب', 'order(s)')}</p>
                </div>
              </div>
              <div className="space-y-1 border-t border-gray-50 pt-2">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FiPhone size={12} className="text-gray-300" />
                    <span dir="ltr">{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FiMail size={12} className="text-gray-300" />
                    <span dir="ltr" className="truncate">{customer.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
