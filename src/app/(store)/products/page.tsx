'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiSearch, FiShoppingBag } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';
import { translations } from '@/i18n/translations';
import SarIcon from '@/components/SarIcon';

interface Product {
  _id: string; name: string; nameAr: string; price: number; images: string[]; inStock: boolean; category: string; featured: boolean;
}

const categories = ['الكل', 'زهور', 'باقات', 'هدايا', 'شوكولاتة', 'عطور', 'تنسيقات', 'عام'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('الكل');
  const { addItem } = useCartStore();
  const { locale } = useLanguageStore();
  const t = translations[locale].products;

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then((data) => { setProducts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.nameAr.includes(search) || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'الكل' || p.category === category;
    return matchSearch && matchCategory;
  });

  const handleAdd = (p: Product) => {
    addItem({ id: p._id, name: p.name, nameAr: p.nameAr, price: p.price, quantity: 1, image: p.images?.[0] || '/logo.png' });
  };

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <p className="text-[#5B7B6D] text-xs font-semibold uppercase tracking-[0.2em] mb-2">
          {locale === 'ar' ? 'تسوق' : 'Shop'}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{t.title}</h1>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative max-w-md">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none text-sm shadow-sm" />
          </div>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  category === c
                    ? 'bg-[#5B7B6D] text-white shadow-sm shadow-[#5B7B6D]/20'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-[#5B7B6D]/30 hover:text-[#5B7B6D]'
                }`}>
                {c === 'الكل' ? t.all : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FiSearch size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">{t.noProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {filtered.map((p) => (
              <div key={p._id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100/80">
                <Link href={`/products/${p._id}`} className="block">
                  <div className="relative h-52 sm:h-60 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <Image src={p.images?.[0] || '/logo.png'} alt={locale === 'ar' ? p.nameAr : p.name} fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    {p.featured && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {locale === 'ar' ? 'مميز' : 'Featured'}
                      </span>
                    )}
                    {!p.inStock && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-4 py-2 bg-white/90 text-gray-800 text-sm font-bold rounded-full">{t.outOfStock}</span>
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
                      aria-label={t.addToCart}>
                      <FiShoppingBag size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
