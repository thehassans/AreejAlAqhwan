'use client';

import { useEffect, useState } from 'react';
import { FiPackage, FiSearch } from 'react-icons/fi';
import Image from 'next/image';
import SarIcon from '@/components/SarIcon';

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  isAvailable: boolean;
}

export default function WorkerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.nameAr || '').includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">المنتجات</h1>
        <p className="text-sm text-gray-400 mt-0.5">{products.length} منتج</p>
      </div>
      <div className="relative">
        <FiSearch size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="بحث في المنتجات..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5B7B6D]/30 focus:border-[#5B7B6D] outline-none bg-gray-50 focus:bg-white transition-all" />
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
          <FiPackage size={32} className="mx-auto mb-3 text-gray-200" />
          <p>لا توجد منتجات</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(product => (
            <div key={product._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative aspect-square bg-gray-50">
                {product.image ? (
                  <Image src={product.image} alt={product.nameAr || product.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FiPackage size={28} className="text-gray-200" />
                  </div>
                )}
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs bg-red-500 px-2 py-0.5 rounded-full">غير متاح</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800 truncate">{product.nameAr || product.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="flex items-center gap-0.5 text-sm font-bold text-[#5B7B6D]">
                    {product.price.toFixed(2)} <SarIcon size={11} />
                  </span>
                  <span className="text-xs text-gray-400">مخزون: {product.stock}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
