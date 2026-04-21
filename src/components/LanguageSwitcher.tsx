'use client';

import { useLocale } from '@/lib/i18n';

/**
 * Premium pill-style language switcher. Toggles between Arabic and English.
 */
export default function LanguageSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { lang, setLang } = useLocale();
  const base = variant === 'dark'
    ? 'bg-white/10 ring-1 ring-white/20'
    : 'bg-gradient-to-br from-gray-100 to-gray-50 ring-1 ring-gray-200';
  const activeBg = variant === 'dark'
    ? 'bg-white text-[#1f2937] shadow-md'
    : 'bg-[#5B7B6D] text-white shadow-md';
  const inactive = variant === 'dark' ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-700';

  return (
    <div className={`inline-flex items-center rounded-full p-0.5 ${base}`} dir="ltr">
      <button
        type="button"
        aria-label="Arabic"
        onClick={() => setLang('ar')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${lang === 'ar' ? activeBg : inactive}`}
      >
        AR
      </button>
      <button
        type="button"
        aria-label="English"
        onClick={() => setLang('en')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${lang === 'en' ? activeBg : inactive}`}
      >
        EN
      </button>
    </div>
  );
}
