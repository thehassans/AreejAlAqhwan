'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FiShoppingBag } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';
import { translations } from '@/i18n/translations';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { setOpen, getCount } = useCartStore();
  const { locale, toggleLocale } = useLanguageStore();
  const t = translations[locale].nav;
  const isHome = pathname === '/';

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navBg = isHome && !scrolled
    ? 'bg-transparent'
    : 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100/50';

  const textColor = isHome && !scrolled ? 'text-white' : 'text-gray-800';
  const linkHover = isHome && !scrolled ? 'hover:text-white/80' : 'hover:text-[#5B7B6D]';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full ring-2 ring-white/20 overflow-hidden flex-shrink-0 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
            </div>
            <span className={`text-lg font-bold tracking-tight transition-colors duration-300 ${isHome && !scrolled ? 'text-white' : 'text-[#5B7B6D]'}`}>
              أريج الأخوان
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: '/', label: t.home },
              { href: '/products', label: t.products },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className={`relative text-sm font-medium transition-colors duration-200 ${textColor} ${linkHover} ${
                  pathname === link.href ? 'after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-current after:rounded-full' : ''
                }`}>
                {link.label}
              </Link>
            ))}

            <button onClick={toggleLocale}
              className={`px-3.5 py-1.5 text-xs font-medium border rounded-full transition-all duration-200 ${
                isHome && !scrolled
                  ? 'border-white/40 text-white hover:bg-white/10'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }`}>
              {locale === 'ar' ? 'EN' : 'عربي'}
            </button>

            <button onClick={() => setOpen(true)}
              className={`relative p-2.5 rounded-full transition-all duration-200 ${
                isHome && !scrolled
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Cart">
              <FiShoppingBag size={20} />
              {mounted && getCount() > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-[#5B7B6D] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                  {getCount()}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: only language toggle + cart (bottom nav handles navigation) */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleLocale}
              className={`px-3 py-1 text-xs font-medium border rounded-full transition-all ${
                isHome && !scrolled
                  ? 'border-white/40 text-white hover:bg-white/10'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {locale === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
