'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiHome, FiFileText, FiPackage, FiShoppingCart, FiUsers,
  FiSettings, FiLogOut, FiMenu, FiX, FiCamera,
} from 'react-icons/fi';

interface WorkerPayload {
  name: string;
  email: string;
  pageAccess: string[];
}

const PAGE_MAP: Record<string, { href: string; label: string; icon: React.ElementType }> = {
  invoices:  { href: '/worker/dashboard/invoices',  label: 'الفواتير',    icon: FiFileText },
  products:  { href: '/worker/dashboard/products',  label: 'المنتجات',    icon: FiPackage },
  orders:    { href: '/worker/dashboard/orders',    label: 'الطلبات',     icon: FiShoppingCart },
  customers: { href: '/worker/dashboard/customers', label: 'العملاء',     icon: FiUsers },
  settings:  { href: '/worker/dashboard/settings',  label: 'الإعدادات',   icon: FiSettings },
};

export default function WorkerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [worker, setWorker] = useState<WorkerPayload | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/worker-auth/check')
      .then(r => {
        if (!r.ok) { router.replace('/worker'); return null; }
        return r.json();
      })
      .then(data => {
        if (data) { setWorker(data.worker); setChecking(false); }
      })
      .catch(() => router.replace('/worker'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/worker-auth/logout', { method: 'POST' });
    router.replace('/worker');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
      </div>
    );
  }

  const allowedNavItems = [
    { href: '/worker/dashboard', label: 'الرئيسية', icon: FiHome },
    { href: '/worker/dashboard/scan', label: 'تسجيل الحضور', icon: FiCamera },
    ...(worker?.pageAccess || []).map(key => PAGE_MAP[key]).filter(Boolean),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/worker/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 relative ring-2 ring-[#5B7B6D]/20">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
            </div>
            <div>
              <span className="text-sm font-bold text-[#5B7B6D] block">أريج الأخوان</span>
              <span className="text-xs text-gray-400">لوحة الموظف</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1" aria-label="Close sidebar">
            <FiX size={20} />
          </button>
        </div>

        {/* Worker Info */}
        {worker && (
          <div className="mx-3 mt-3 mb-1 bg-[#5B7B6D]/5 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#5B7B6D]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[#5B7B6D] font-bold text-sm">{worker.name.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{worker.name}</p>
                <p className="text-xs text-gray-400 truncate">{worker.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-3 space-y-0.5">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/worker/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            const isScan = item.href === '/worker/dashboard/scan';
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isScan
                    ? isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : isActive
                    ? 'bg-[#5B7B6D] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {item.label}
                {isScan && !isActive && (
                  <span className="mr-auto flex items-center justify-center w-5 h-5 bg-emerald-500 rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
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
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
            </div>
            <h1 className="text-base font-bold text-[#5B7B6D]">أريج الأخوان</h1>
          </div>
          {worker && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg truncate max-w-[100px]">
              {worker.name}
            </span>
          )}
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
