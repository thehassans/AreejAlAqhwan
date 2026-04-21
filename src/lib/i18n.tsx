'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'ar' | 'en';

interface LocaleCtx {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (l: Lang) => void;
  toggle: () => void;
  /**
   * Translator function.
   * Usage: t('نص عربي', 'English text')
   * Returns the Arabic string when lang === 'ar', otherwise the English string.
   * If en is omitted, the Arabic string is returned as-is (used only when no
   * English translation is supplied).
   */
  t: (ar: string, en?: string) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

const STORAGE_KEY = 'areej.admin.lang';

export function LocaleProvider({ children, initial = 'ar' }: { children: React.ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial);

  // Load stored preference after mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === 'ar' || stored === 'en') setLangState(stored);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => setLang(lang === 'ar' ? 'en' : 'ar'), [lang, setLang]);

  const t = useCallback((ar: string, en?: string) => {
    if (lang === 'ar') return ar;
    return en ?? ar;
  }, [lang]);

  const value = useMemo<LocaleCtx>(() => ({
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    setLang,
    toggle,
    t,
  }), [lang, setLang, toggle, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Graceful fallback — return Arabic without crashing if provider missing
    return {
      lang: 'ar',
      dir: 'rtl',
      setLang: () => {},
      toggle: () => {},
      t: (ar: string, _en?: string) => ar,
    };
  }
  return ctx;
}

/** Shorthand hook: returns just the t() translator. */
export function useT() {
  return useLocale().t;
}
