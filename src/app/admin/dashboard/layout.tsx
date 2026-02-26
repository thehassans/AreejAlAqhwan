'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiFileText, FiPackage, FiShoppingCart, FiUsers, FiSettings, FiLogOut, FiMenu, FiX, FiUserCheck, FiCalendar } from 'react-icons/fi';

const navItems = [
  { href: '/admin/dashboard', label: 'الرئيسية', icon: FiHome },
  { href: '/admin/dashboard/invoices', label: 'الفواتير', icon: FiFileText },
  { href: '/admin/dashboard/products', label: 'المنتجات', icon: FiPackage },
  { href: '/admin/dashboard/orders', label: 'الطلبات', icon: FiShoppingCart },
  { href: '/admin/dashboard/customers', label: 'العملاء', icon: FiUsers },
  { href: '/admin/dashboard/workers', label: 'الموظفون', icon: FiUserCheck },
  { href: '/admin/dashboard/attendance', label: 'الحضور', icon: FiCalendar },
  { href: '/admin/dashboard/settings', label: 'الإعدادات', icon: FiSettings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/check').then((r) => {
      if (!r.ok) router.replace('/admin');
      else setChecking(false);
    }).catch(() => router.replace('/admin'));
  }, [router]);

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
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 relative ring-2 ring-[#5B7B6D]/20">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
            </div>
            <span className="text-base font-bold text-[#5B7B6D]">أريج الأخوان</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1" aria-label="Close sidebar">
            <FiX size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2" aria-label="Open sidebar">
            <FiMenu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
            </div>
            <h1 className="text-lg font-bold text-[#5B7B6D]">أريج الأخوان</h1>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
