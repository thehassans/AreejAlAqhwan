'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';
import { translations } from '@/i18n/translations';
import SarIcon from '@/components/SarIcon';

interface Product {
  _id: string; name: string; nameAr: string; price: number; images: string[]; inStock: boolean; category: string; featured: boolean;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const { locale } = useLanguageStore();
  const t = translations[locale];

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then((data) => { setProducts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const featured = products.filter((p) => p.featured);
  const handleAdd = (p: Product) => {
    addItem({ id: p._id, name: p.name, nameAr: p.nameAr, price: p.price, quantity: 1, image: p.images?.[0] || '/logo.png' });
  };

  return (
    <div className="bg-[#FAFAF8]">
      {/* Hero Banner Video */}
      <section className="relative h-[85vh] lg:h-screen overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover object-center">
          <source src="/banner.webm" type="video/webm" />
          <source src="/banner.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6 pt-16 lg:pt-20">
          <span className="inline-block px-4 py-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full text-xs sm:text-sm font-medium mb-5 tracking-widest uppercase">
            {locale === 'ar' ? 'مرحباً بكم' : 'Welcome'}
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-5 drop-shadow-lg leading-tight">
            {locale === 'ar' ? 'أريج الأقحوان' : 'Areej Al Aqhwan'}
          </h1>
          <p className="text-base sm:text-xl lg:text-2xl max-w-3xl mb-10 opacity-90 drop-shadow font-light">
            {locale === 'ar' ? 'زهور وهدايا فاخرة لكل مناسبة' : 'Premium flowers & gifts for every occasion'}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/products" className="px-8 py-3.5 bg-[#5B7B6D] text-white rounded-full font-semibold hover:bg-[#4a6a5c] transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-sm sm:text-base">
              {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
            </Link>
            <Link href="/products" className="px-8 py-3.5 bg-white/15 backdrop-blur-sm border border-white/40 text-white rounded-full font-semibold hover:bg-white/25 transition-all duration-300 text-sm sm:text-base">
              {locale === 'ar' ? 'اكتشف المزيد' : 'Explore'}
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/60 animate-bounce">
          <div className="w-0.5 h-8 bg-white/40 rounded-full" />
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[#5B7B6D] text-xs font-semibold uppercase tracking-[0.2em] mb-1">
                {locale === 'ar' ? 'مختارات مميزة' : 'Featured'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {locale === 'ar' ? 'الأكثر مبيعاً' : 'Best Sellers'}
              </h2>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-[#5B7B6D] text-sm font-medium hover:underline">
              {locale === 'ar' ? 'عرض الكل' : 'View All'} <FiArrowLeft size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {featured.slice(0, 8).map((p) => (
              <div key={p._id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100/80">
                <Link href={`/products/${p._id}`} className="block">
                  <div className="relative h-52 sm:h-60 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <Image src={p.images?.[0] || '/logo.png'} alt={locale === 'ar' ? p.nameAr : p.name} fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {locale === 'ar' ? 'مميز' : 'Featured'}
                    </span>
                  </div>
                </Link>
                <div className="p-3 sm:p-4 space-y-1.5">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{p.category}</p>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                    {locale === 'ar' ? p.nameAr : p.name}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#5B7B6D] font-bold text-base flex items-center gap-1">
                      {p.price.toFixed(2)} <SarIcon size={14} />
                    </span>
                    <button onClick={(e) => { e.preventDefault(); handleAdd(p); }} disabled={!p.inStock}
                      className="w-9 h-9 flex items-center justify-center bg-[#5B7B6D] text-white rounded-full hover:bg-[#4a6a5c] active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                      aria-label={t.products.addToCart}>
                      <FiShoppingBag size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {locale === 'ar' ? 'جميع المنتجات' : 'All Products'}
          </h2>
          <Link href="/products" className="flex items-center gap-1 text-[#5B7B6D] text-sm font-medium hover:underline">
            {locale === 'ar' ? 'عرض الكل' : 'View All'} <FiArrowLeft size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {products.slice(0, 12).map((p) => (
              <div key={p._id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100/80">
                <Link href={`/products/${p._id}`} className="block">
                  <div className="relative h-52 sm:h-60 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <Image src={p.images?.[0] || '/logo.png'} alt={locale === 'ar' ? p.nameAr : p.name} fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    {!p.inStock && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-4 py-2 bg-white/90 text-gray-800 text-sm font-bold rounded-full">{t.products.outOfStock}</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3 sm:p-4 space-y-1.5">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{p.category}</p>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                    {locale === 'ar' ? p.nameAr : p.name}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#5B7B6D] font-bold text-base flex items-center gap-1">
                      {p.price.toFixed(2)} <SarIcon size={14} />
                    </span>
                    <button onClick={(e) => { e.preventDefault(); handleAdd(p); }} disabled={!p.inStock}
                      className="w-9 h-9 flex items-center justify-center bg-[#5B7B6D] text-white rounded-full hover:bg-[#4a6a5c] active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                      aria-label={t.products.addToCart}>
                      <FiShoppingBag size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
