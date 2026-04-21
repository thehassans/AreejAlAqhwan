'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiFileText, FiPackage, FiShoppingCart, FiUsers, FiSettings, FiUserCheck, FiCalendar } from 'react-icons/fi';
import DashboardMobileNav from '@/components/DashboardMobileNav';
import DashboardHeader from '@/components/DashboardHeader';
import { useT } from '@/lib/i18n';

const allNavItems = [
  { href: '/admin/dashboard', labelAr: 'الرئيسية', labelEn: 'Home', icon: FiHome, key: 'dashboard' },
  { href: '/admin/dashboard/invoices', labelAr: 'الفواتير', labelEn: 'Invoices', icon: FiFileText, key: 'invoices' },
  { href: '/admin/dashboard/products', labelAr: 'المنتجات', labelEn: 'Products', icon: FiPackage, key: 'products' },
  { href: '/admin/dashboard/orders', labelAr: 'الطلبات', labelEn: 'Orders', icon: FiShoppingCart, key: 'orders' },
  { href: '/admin/dashboard/customers', labelAr: 'العملاء', labelEn: 'Customers', icon: FiUsers, key: 'customers' },
  { href: '/admin/dashboard/workers', labelAr: 'الموظفون', labelEn: 'Employees', icon: FiUserCheck, key: 'workers' },
  { href: '/admin/dashboard/attendance', labelAr: 'الحضور', labelEn: 'Attendance', icon: FiCalendar, key: 'attendance' },
  { href: '/admin/dashboard/settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: FiSettings, key: 'settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<'admin' | 'worker'>('admin');
  const [pageAccess, setPageAccess] = useState<string[]>([]);
  const [adminName, setAdminName] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/check').then(async (r) => {
      if (!r.ok) { router.replace('/admin'); return; }
      const data = await r.json();
      setRole(data.admin?.role || 'admin');
      setPageAccess(data.admin?.pageAccess || []);
      setAdminName(data.admin?.name || '');
      setAdminEmail(data.admin?.email || '');
      setChecking(false);
    }).catch(() => router.replace('/admin'));
  }, [router]);

  const navItems = role === 'admin'
    ? allNavItems
    : allNavItems.filter((item) => item.key === 'dashboard' || item.key === 'attendance' || pageAccess.includes(item.key));

  const mobileNavItems = navItems.map((n) => ({ href: n.href, label: t(n.labelAr, n.labelEn), icon: n.icon }));

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-col lg:border-l lg:border-gray-200 lg:bg-white">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 relative ring-2 ring-[#5B7B6D]/20">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
            </div>
            <span className="text-base font-bold text-[#5B7B6D]">{t('أريج الأقحوان', 'Areej Al Aqhwan')}</span>
          </Link>
        </div>
        <nav className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-[#5B7B6D] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <item.icon size={18} />
                {t(item.labelAr, item.labelEn)}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <DashboardHeader onLogout={handleLogout} userName={adminName} userRole={adminEmail} />
        <main className="flex-1 overflow-auto p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>
        <div className="lg:hidden">
          <DashboardMobileNav items={mobileNavItems} />
        </div>
      </div>
    </div>
  );
}
