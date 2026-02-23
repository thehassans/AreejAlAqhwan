'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';
import { translations } from '@/i18n/translations';
import SarIcon from '@/components/SarIcon';
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, setOpen, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { locale } = useLanguageStore();
  const t = translations[locale].cart;
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const handlePlaceOrder = () => {
    setOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 ${locale === 'ar' ? 'left-0' : 'right-0'} h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : locale === 'ar' ? '-translate-x-full' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Premium Header */}
          <div className="relative px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#5B7B6D]/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5B7B6D]/10 flex items-center justify-center">
                  <FiShoppingBag size={20} className="text-[#5B7B6D]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t.title}</h2>
                  {itemCount > 0 && (
                    <p className="text-xs text-gray-500">
                      {itemCount} {locale === 'ar' ? 'منتج' : 'item'}{itemCount > 1 && locale !== 'ar' ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <FiX size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                  <FiShoppingBag size={40} className="text-gray-300" />
                </div>
                <p className="text-lg font-semibold text-gray-800 mb-2">{t.empty}</p>
                <p className="text-sm text-gray-400 mb-6">
                  {locale === 'ar' ? 'ابدأ التسوق وأضف منتجات لسلتك' : 'Start shopping and add items to your cart'}
                </p>
                <button
                  onClick={() => { setOpen(false); router.push('/products'); }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5B7B6D] text-white rounded-full text-sm font-medium hover:bg-[#4a6a5c] transition-colors"
                >
                  {t.continueShopping} <FiArrowLeft size={14} />
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="group flex gap-3 p-3 bg-gray-50/80 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Image */}
                    <div className="w-20 h-20 relative rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                      <Image src={item.image || '/logo.png'} alt={item.name} fill className="object-cover" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900 truncate leading-tight">
                          {locale === 'ar' ? item.nameAr : item.name}
                        </h3>
                        <p className="text-[#5B7B6D] font-bold text-sm mt-1 flex items-center gap-1">
                          {item.price.toFixed(2)} <SarIcon size={12} />
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
                            aria-label="Decrease"
                          >
                            <FiMinus size={12} className="text-gray-500" />
                          </button>
                          <span className="text-sm font-bold w-5 text-center text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
                            aria-label="Increase"
                          >
                            <FiPlus size={12} className="text-gray-500" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 flex items-center gap-0.5">
                            {(item.price * item.quantity).toFixed(2)} <SarIcon size={11} />
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            aria-label="Remove"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Premium Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 bg-white px-5 py-4 space-y-4">
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span className="flex items-center gap-1">{getTotal().toFixed(2)} <SarIcon size={12} /></span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-gray-900">{t.total}</span>
                  <span className="text-[#5B7B6D] flex items-center gap-1">
                    {getTotal().toFixed(2)} <SarIcon size={16} />
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-[#5B7B6D] to-[#4a6a5c] text-white rounded-2xl font-bold text-base hover:from-[#4a6a5c] hover:to-[#3d5a4c] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 shadow-lg shadow-[#5B7B6D]/20"
              >
                {locale === 'ar' ? 'إتمام الطلب' : 'Place Order'}
              </button>

              {/* Continue Shopping */}
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2.5 text-gray-500 text-sm font-medium hover:text-[#5B7B6D] transition-colors flex items-center justify-center gap-2"
              >
                {t.continueShopping}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
