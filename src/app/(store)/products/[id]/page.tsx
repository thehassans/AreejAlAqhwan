'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';
import { translations } from '@/i18n/translations';
import SarIcon from '@/components/SarIcon';

interface Product {
  _id: string; name: string; nameAr: string; description: string; descriptionAr: string;
  price: number; images: string[]; inStock: boolean; category: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const { locale } = useLanguageStore();
  const t = translations[locale].product;

  useEffect(() => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then(setProduct).catch(console.error);
  }, [id]);

  if (!product) return <div className="flex items-center justify-center h-96"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;

  const handleAdd = () => {
    addItem({ id: product._id, name: product.name, nameAr: product.nameAr, price: product.price, quantity, image: product.images?.[0] || '/logo.png' });
  };

  const images = product.images?.length ? product.images : ['/logo.png'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative h-96 bg-gray-100 rounded-2xl overflow-hidden">
            <Image src={images[selectedImage]} alt={locale === 'ar' ? product.nameAr : product.name} fill className="object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? 'border-[#5B7B6D]' : 'border-transparent'}`}>
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">{product.category}</p>
            <h1 className="text-3xl font-bold text-gray-800">{locale === 'ar' ? product.nameAr : product.name}</h1>
            <p className="text-2xl font-bold text-[#5B7B6D] mt-3 flex items-center gap-1">{product.price} <SarIcon size={20} /></p>
          </div>

          {(product.descriptionAr || product.description) && (
            <div>
              <h2 className="font-bold text-gray-800 mb-2">{t.description}</h2>
              <p className="text-gray-600 leading-relaxed">{locale === 'ar' ? product.descriptionAr : product.description}</p>
            </div>
          )}

          {product.inStock ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.quantity}</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center border rounded-lg hover:bg-gray-50" aria-label="Decrease">
                    <FiMinus size={16} />
                  </button>
                  <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center border rounded-lg hover:bg-gray-50" aria-label="Increase">
                    <FiPlus size={16} />
                  </button>
                </div>
              </div>
              <button onClick={handleAdd}
                className="w-full py-3 bg-[#5B7B6D] text-white rounded-xl font-bold text-lg hover:bg-[#4a6a5c] transition-colors">
                {t.addToCart}
              </button>
            </div>
          ) : (
            <div className="py-4 px-6 bg-red-50 text-red-600 rounded-xl text-center font-medium">{t.outOfStock}</div>
          )}
        </div>
      </div>
    </div>
  );
}
