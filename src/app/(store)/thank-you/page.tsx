'use client';

import Link from 'next/link';
import { FiCheckCircle, FiHome, FiShoppingBag } from 'react-icons/fi';
import { useLanguageStore } from '@/store/languageStore';

export default function ThankYouPage() {
  const { locale } = useLanguageStore();

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4 pt-20">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {locale === 'ar' ? 'شكراً لطلبك!' : 'Thank you for your order!'}
        </h1>
        <p className="text-gray-500 mb-8">
          {locale === 'ar'
            ? 'تم استلام طلبك بنجاح وسنتواصل معك قريباً'
            : 'Your order has been received. We will contact you soon.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="flex items-center justify-center gap-2 px-6 py-3 bg-[#5B7B6D] text-white rounded-full font-medium hover:bg-[#4a6a5c] transition-colors">
            <FiHome size={16} /> {locale === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <Link href="/products" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#5B7B6D] border border-[#5B7B6D] rounded-full font-medium hover:bg-[#5B7B6D]/5 transition-colors">
            <FiShoppingBag size={16} /> {locale === 'ar' ? 'تسوق المزيد' : 'Shop More'}
          </Link>
        </div>
      </div>
    </div>
  );
}
