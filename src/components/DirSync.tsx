'use client';

import { useEffect, useRef } from 'react';
import { useLanguageStore } from '@/store/languageStore';

export default function DirSync() {
  const { locale } = useLanguageStore();
  const isFirst = useRef(true);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isFirst.current) {
      // On mount: apply without animation
      isFirst.current = false;
      html.dir = locale === 'ar' ? 'rtl' : 'ltr';
      html.lang = locale;
      return;
    }

    // On toggle: fade out → change dir → fade in
    body.style.transition = 'opacity 0.15s ease';
    body.style.opacity = '0';

    const timer = setTimeout(() => {
      html.dir = locale === 'ar' ? 'rtl' : 'ltr';
      html.lang = locale;
      body.style.opacity = '1';
    }, 150);

    return () => clearTimeout(timer);
  }, [locale]);

  return null;
}
