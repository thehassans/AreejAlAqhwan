import { create } from 'zustand';

interface LanguageState {
  locale: 'ar' | 'en';
  setLocale: (locale: 'ar' | 'en') => void;
  toggleLocale: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'ar',
  setLocale: (locale) => set({ locale }),
  toggleLocale: () => set((state) => ({ locale: state.locale === 'ar' ? 'en' : 'ar' })),
}));
