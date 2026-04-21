'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const CATEGORIES: Array<{ value: string; ar: string; en: string }> = [
  { value: 'عام', ar: 'عام', en: 'General' },
  { value: 'زهور', ar: 'زهور', en: 'Flowers' },
  { value: 'باقات', ar: 'باقات', en: 'Bouquets' },
  { value: 'هدايا', ar: 'هدايا', en: 'Gifts' },
  { value: 'شوكولاتة', ar: 'شوكولاتة', en: 'Chocolate' },
  { value: 'عطور', ar: 'عطور', en: 'Perfumes' },
  { value: 'تنسيقات', ar: 'تنسيقات', en: 'Arrangements' },
];

export default function CreateProductPage() {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('عام');
  const [inStock, setInStock] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('folder', 'products');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setImages([...images, data.url]);
    } catch { toast.error(t('فشل رفع الصورة', 'Image upload failed')); }
    finally { setUploading(false); }
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!nameAr.trim()) { toast.error(t('يرجى إدخال اسم المنتج بالعربي', 'Please enter the Arabic product name')); return; }
    if (!price) { toast.error(t('يرجى إدخال السعر', 'Please enter the price')); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nameAr, description, descriptionAr, price: parseFloat(price), category, inStock, featured, images, discount: parseFloat(discount) || 0, discountType }),
      });
      if (res.ok) {
        toast.success(t('تم إضافة المنتج بنجاح', 'Product added successfully'));
        router.push('/admin/dashboard/products');
      } else { toast.error(t('فشل إضافة المنتج', 'Failed to add product')); }
    } catch { toast.error(t('حدث خطأ', 'An error occurred')); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800">{t('إضافة منتج جديد', 'Add new product')}</h1>
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('اسم المنتج (عربي)', 'Product name (Arabic)')} *</label>
            <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('اسم المنتج (إنجليزي)', 'Product name (English)')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('الوصف (عربي)', 'Description (Arabic)')}</label>
            <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('الوصف (إنجليزي)', 'Description (English)')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('السعر (ر.س)', 'Price (SAR)')} *</label>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('التصنيف', 'Category')}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" title={t('التصنيف', 'Category')}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{t(c.ar, c.en)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('نوع الخصم', 'Discount type')}</label>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" title={t('نوع الخصم', 'Discount type')}>
              <option value="percentage">{t('نسبة مئوية (%)', 'Percentage (%)')}</option>
              <option value="fixed">{t('مبلغ ثابت (ر.س)', 'Fixed amount (SAR)')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('قيمة الخصم', 'Discount value')}</label>
            <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="w-4 h-4 accent-[#5B7B6D]" />
            <span className="text-sm">{t('متوفر', 'In stock')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4 accent-[#5B7B6D]" />
            <span className="text-sm">{t('مميز', 'Featured')}</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('صور المنتج', 'Product images')}</label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center" aria-label="Remove image"><FiX size={12} /></button>
              </div>
            ))}
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#5B7B6D] transition-colors">
              <FiUpload size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">{uploading ? t('جاري...', 'Loading...') : t('رفع', 'Upload')}</span>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-[#5B7B6D] text-white rounded-xl text-sm font-medium hover:bg-[#4a6a5c] transition-colors disabled:opacity-50">
            {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ المنتج', 'Save product')}
          </button>
          <button onClick={() => router.back()} className="px-6 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">{t('إلغاء', 'Cancel')}</button>
        </div>
      </div>
    </div>
  );
}
