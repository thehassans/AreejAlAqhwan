'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardMobileNavItem {
  href: string;
  label: string;
  icon: ElementType;
  variant?: 'default' | 'accent';
}

export default function DashboardMobileNav({ items }: { items: DashboardMobileNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max items-stretch px-2 py-2">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/worker/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            const accent = item.variant === 'accent';

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-w-[76px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition-all ${
                  accent
                    ? isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-700 hover:bg-emerald-50'
                    : isActive
                      ? 'bg-[#5B7B6D]/10 text-[#5B7B6D]'
                      : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} className={isActive ? '' : 'opacity-80'} />
                <span className="whitespace-nowrap">{item.label}</span>
                {isActive && !accent && <span className="absolute bottom-1 h-1 w-6 rounded-full bg-[#5B7B6D]" />}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white/95" />
    </nav>
  );
}
