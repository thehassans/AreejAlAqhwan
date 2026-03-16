'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiFileText, FiPackage, FiShoppingCart, FiUsers, FiSettings, FiLogOut, FiUserCheck, FiCalendar } from 'react-icons/fi';
import DashboardMobileNav from '@/components/DashboardMobileNav';

const allNavItems = [
  { href: '/admin/dashboard', label: 'الرئيسية', icon: FiHome, key: 'dashboard' },
  { href: '/admin/dashboard/invoices', label: 'الفواتير', icon: FiFileText, key: 'invoices' },
  { href: '/admin/dashboard/products', label: 'المنتجات', icon: FiPackage, key: 'products' },
  { href: '/admin/dashboard/orders', label: 'الطلبات', icon: FiShoppingCart, key: 'orders' },
  { href: '/admin/dashboard/customers', label: 'العملاء', icon: FiUsers, key: 'customers' },
  { href: '/admin/dashboard/workers', label: 'الموظفون', icon: FiUserCheck, key: 'workers' },
  { href: '/admin/dashboard/attendance', label: 'الحضور', icon: FiCalendar, key: 'attendance' },
  { href: '/admin/dashboard/settings', label: 'الإعدادات', icon: FiSettings, key: 'settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<'admin' | 'worker'>('admin');
  const [pageAccess, setPageAccess] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/auth/check').then(async (r) => {
      if (!r.ok) { router.replace('/admin'); return; }
      const data = await r.json();
      setRole(data.admin?.role || 'admin');
      setPageAccess(data.admin?.pageAccess || []);
      setChecking(false);
    }).catch(() => router.replace('/admin'));
  }, [router]);

  const navItems = role === 'admin'
    ? allNavItems
    : allNavItems.filter((item) => item.key === 'dashboard' || item.key === 'attendance' || pageAccess.includes(item.key));

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
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-l lg:border-gray-200 lg:bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 relative ring-2 ring-[#5B7B6D]/20">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
            </div>
            <span className="text-base font-bold text-[#5B7B6D]">أريج الأقحوان</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-[#5B7B6D] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors">
            <FiLogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 relative">
                <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
              </div>
              <h1 className="text-base font-bold text-[#5B7B6D] truncate">أريج الأقحوان</h1>
            </div>
            <button onClick={handleLogout} className="shrink-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
              تسجيل الخروج
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>
        <div className="lg:hidden">
          <DashboardMobileNav items={navItems} />
        </div>
      </div>
    </div>
  );
}
