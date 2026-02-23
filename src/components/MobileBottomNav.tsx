'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiHome, FiGrid, FiShoppingBag, FiUser } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';

const navItems = [
  { href: '/', icon: FiHome, labelAr: 'الرئيسية', labelEn: 'Home' },
  { href: '/products', icon: FiGrid, labelAr: 'المنتجات', labelEn: 'Products' },
  { href: '#cart', icon: FiShoppingBag, labelAr: 'السلة', labelEn: 'Cart' },
  { href: '/checkout', icon: FiUser, labelAr: 'الطلب', labelEn: 'Order' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { items, isOpen, setOpen } = useCartStore();
  const { locale } = useLanguageStore();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isCart = item.href === '#cart';
          const isActive = !isCart && pathname === item.href;
          const Icon = item.icon;
          const label = locale === 'ar' ? item.labelAr : item.labelEn;

          if (isCart) {
            return (
              <button
                key={item.href}
                onClick={() => setOpen(!isOpen)}
                className="flex flex-col items-center justify-center gap-0.5 relative group w-16"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#5B7B6D] flex items-center justify-center shadow-lg shadow-[#5B7B6D]/30 group-active:scale-95 transition-transform">
                    <Icon size={18} className="text-white" />
                  </div>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-[#5B7B6D]">{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 group transition-colors ${
                isActive ? 'text-[#5B7B6D]' : 'text-gray-400'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#5B7B6D]/10' : 'group-active:bg-gray-100'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={`text-[10px] transition-colors ${isActive ? 'font-semibold text-[#5B7B6D]' : 'font-medium'}`}>
                {label}
              </span>
              {isActive && <div className="absolute bottom-1 w-4 h-0.5 rounded-full bg-[#5B7B6D]" />}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iPhone notch */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white/95" />
    </nav>
  );
}
