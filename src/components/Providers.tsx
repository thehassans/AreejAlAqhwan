'use client';

import { Toaster } from 'react-hot-toast';
import { LocaleProvider } from '@/lib/i18n';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <Toaster position="top-center" />
      {children}
    </LocaleProvider>
  );
}
