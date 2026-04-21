'use client';

import Image from 'next/image';
import { FiLogOut, FiBell } from 'react-icons/fi';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useT } from '@/lib/i18n';

interface Props {
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  storeName?: string;
  storeNameEn?: string;
}

/**
 * Ultra-premium dashboard header — glass morphism, gradient, logo, user chip,
 * language switcher, logout. Shown on every admin/worker dashboard page.
 */
export default function DashboardHeader({ onLogout, userName, userRole, storeName, storeNameEn }: Props) {
  const t = useT();
  const displayStore = t(storeName || 'أريج الأقحوان', storeNameEn || storeName || 'Areej Al Aqhwan');

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(91,123,109,0.08)]">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#5B7B6D]/30 shadow-sm shrink-0">
            <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-[#2f4a3e] tracking-tight leading-tight truncate">
              {displayStore}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-wide uppercase">
              {t('لوحة التحكم', 'Control Panel')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <div className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-to-br from-[#5B7B6D]/10 to-[#5B7B6D]/5 ring-1 ring-[#5B7B6D]/20 px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-[#5B7B6D] text-white flex items-center justify-center text-xs font-bold shadow-inner">
              {userName ? userName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-gray-800 truncate max-w-[140px]">
                {userName || t('المسؤول', 'Admin')}
              </p>
              {userRole && (
                <p className="text-[10px] text-gray-500 truncate max-w-[140px]">
                  {userRole}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label={t('الإشعارات', 'Notifications')}
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors ring-1 ring-gray-200"
          >
            <FiBell size={16} />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-red-500 to-rose-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:from-red-600 hover:to-rose-700 transition-all"
          >
            <FiLogOut size={14} />
            <span className="hidden sm:inline">{t('تسجيل الخروج', 'Log out')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
