'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiUpload, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Product {
  name: string; nameAr: string; description: string; descriptionAr: string;
  price: number; category: string; inStock: boolean; featured: boolean; images: string[];
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then(setProduct).catch(console.error);
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !product) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      formData.append('folder', 'products');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setProduct({ ...product, images: [...product.images, data.url] });
    } catch { toast.error('فشل رفع الصورة'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!product?.nameAr.trim()) { toast.error('يرجى إدخال اسم المنتج'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) { toast.success('تم تحديث المنتج'); router.push('/admin/dashboard/products'); }
      else toast.error('فشل تحديث المنتج');
    } catch { toast.error('حدث خطأ'); }
    finally { setSaving(false); }
  };

  if (!product) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  const update = (field: keyof Product, value: Product[keyof Product]) => setProduct({ ...product, [field]: value });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800">تعديل المنتج</h1>
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج (عربي) *</label>
            <input type="text" value={product.nameAr} onChange={(e) => update('nameAr', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج (إنجليزي)</label>
            <input type="text" value={product.name} onChange={(e) => update('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف (عربي)</label>
            <textarea value={product.descriptionAr} onChange={(e) => update('descriptionAr', e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف (إنجليزي)</label>
            <textarea value={product.description} onChange={(e) => update('description', e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السعر (ر.س) *</label>
            <input type="number" min="0" step="0.01" value={product.price} onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
            <select value={product.category} onChange={(e) => update('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" title="التصنيف">
              {['عام', 'زهور', 'باقات', 'هدايا', 'شوكولاتة', 'عطور', 'تنسيقات'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={product.inStock} onChange={(e) => update('inStock', e.target.checked)} className="w-4 h-4 accent-[#5B7B6D]" />
              <span className="text-sm">متوفر</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={product.featured} onChange={(e) => update('featured', e.target.checked)} className="w-4 h-4 accent-[#5B7B6D]" />
              <span className="text-sm">مميز</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">صور المنتج</label>
          <div className="flex flex-wrap gap-3">
            {product.images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                <Image src={img} alt="" fill className="object-cover" />
                <button onClick={() => update('images', product.images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center" aria-label="Remove"><FiX size={12} /></button>
              </div>
            ))}
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#5B7B6D]">
              <FiUpload size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">{uploading ? 'جاري...' : 'رفع'}</span>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-[#5B7B6D] text-white rounded-xl text-sm font-medium hover:bg-[#4a6a5c] disabled:opacity-50">
            {saving ? 'جاري الحفظ...' : 'تحديث المنتج'}
          </button>
          <button onClick={() => router.back()} className="px-6 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
