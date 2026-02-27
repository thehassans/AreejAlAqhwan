'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '@/lib/utils';
import SarIcon from '@/components/SarIcon';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  price: number;
  category: string;
  images: string[];
  inStock: boolean;
  featured: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then((data) => { setProducts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(products.filter((p) => p._id !== id));
      toast.success('تم حذف المنتج');
    } else {
      toast.error('فشل حذف المنتج');
    }
  };

  const toggleField = async (id: string, field: 'inStock' | 'featured', current: boolean) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    if (res.ok) {
      setProducts(products.map((p) => p._id === id ? { ...p, [field]: !current } : p));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">المنتجات</h1>
        <Link href="/admin/dashboard/products/create" className="flex items-center gap-2 px-4 py-2 bg-[#5B7B6D] text-white rounded-xl text-sm font-medium hover:bg-[#4a6a5c] transition-colors">
          <FiPlus size={16} /> إضافة منتج
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          <p className="text-lg">لا توجد منتجات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="relative h-48 bg-gray-100">
                <img src={product.images?.[0] || '/logo.png'} alt={product.nameAr} className="w-full h-full object-cover" />
                {product.featured && <span className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs rounded-full font-medium">مميز</span>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm truncate">{product.nameAr}</h3>
                <p className="text-xs text-gray-500">{product.category}</p>
                <p className="text-[#5B7B6D] font-bold mt-1 flex items-center gap-1">{formatCurrency(product.price)} <SarIcon size={13} /></p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => toggleField(product._id, 'inStock', product.inStock)}
                    className={`text-xs px-2 py-1 rounded-full ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.inStock ? 'متوفر' : 'غير متوفر'}
                  </button>
                  <button onClick={() => toggleField(product._id, 'featured', product.featured)}
                    className={`text-xs px-2 py-1 rounded-full ${product.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {product.featured ? 'مميز' : 'عادي'}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3 border-t pt-3">
                  <Link href={`/admin/dashboard/products/${product._id}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium">
                    <FiEdit size={12} /> تعديل
                  </Link>
                  <button onClick={() => handleDelete(product._id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium">
                    <FiTrash2 size={12} /> حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
