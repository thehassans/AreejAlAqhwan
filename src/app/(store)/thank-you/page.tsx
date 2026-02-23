'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiShoppingBag, FiDownload, FiCheck } from 'react-icons/fi';
import { useLanguageStore } from '@/store/languageStore';
import SarIcon from '@/components/SarIcon';

interface OrderData {
  _id: string;
  orderNumber: string;
  items: Array<{ name: string; nameAr: string; price: number; quantity: number }>;
  subtotal: number;
  vat: number;
  total: number;
  customer: { name: string; phone: string };
  createdAt: string;
}

export default function ThankYouPage() {
  const { locale } = useLanguageStore();
  const searchParams = useSearchParams();
  const orderNum = searchParams.get('order');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (orderNum) {
      fetch(`/api/orders?orderNumber=${orderNum}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const found = data.find((o: OrderData) => o.orderNumber === orderNum);
            if (found) setOrder(found);
          }
        })
        .catch(console.error);
    }
    setTimeout(() => setShowContent(true), 300);
  }, [orderNum]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = 210;
      let y = 20;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(91, 123, 109);
      pdf.text('Areej Al-Aqhwan', pageW / 2, y, { align: 'center' });
      y += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.text('Premium Flowers & Gifts', pageW / 2, y, { align: 'center' });
      y += 12;

      pdf.setDrawColor(91, 123, 109);
      pdf.setLineWidth(0.5);
      pdf.line(20, y, pageW - 20, y);
      y += 10;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text('ORDER INVOICE', pageW / 2, y, { align: 'center' });
      y += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Order: ${order.orderNumber}`, 20, y);
      pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`, pageW - 20, y, { align: 'right' });
      y += 6;
      pdf.text(`Customer: ${order.customer.name}`, 20, y);
      pdf.text(`Phone: ${order.customer.phone}`, pageW - 20, y, { align: 'right' });
      y += 10;

      pdf.setFillColor(91, 123, 109);
      pdf.rect(20, y, pageW - 40, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Item', 25, y + 5.5);
      pdf.text('Qty', 120, y + 5.5, { align: 'center' });
      pdf.text('Price', 150, y + 5.5, { align: 'center' });
      pdf.text('Total', pageW - 25, y + 5.5, { align: 'right' });
      y += 12;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      order.items.forEach((item) => {
        pdf.text(item.name || item.nameAr, 25, y);
        pdf.text(String(item.quantity), 120, y, { align: 'center' });
        pdf.text(`${item.price.toFixed(2)} SAR`, 150, y, { align: 'center' });
        pdf.text(`${(item.price * item.quantity).toFixed(2)} SAR`, pageW - 25, y, { align: 'right' });
        y += 7;
      });

      y += 3;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(100, y, pageW - 20, y);
      y += 7;

      pdf.setFontSize(10);
      pdf.text('Subtotal:', 110, y);
      pdf.text(`${order.subtotal.toFixed(2)} SAR`, pageW - 25, y, { align: 'right' });
      y += 6;
      if (order.vat > 0) {
        pdf.text('VAT:', 110, y);
        pdf.text(`${order.vat.toFixed(2)} SAR`, pageW - 25, y, { align: 'right' });
        y += 6;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(91, 123, 109);
      pdf.text('Total:', 110, y);
      pdf.text(`${order.total.toFixed(2)} SAR`, pageW - 25, y, { align: 'right' });

      y += 20;
      pdf.setDrawColor(91, 123, 109);
      pdf.setLineWidth(0.3);
      pdf.line(20, y, pageW - 20, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(140, 140, 140);
      pdf.text('Thank you for choosing Areej Al-Aqhwan. Every flower is selected with love.', pageW / 2, y, { align: 'center' });

      pdf.save(`invoice-${order.orderNumber}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f5f2] via-[#FAFAF8] to-white flex items-center justify-center px-4 pt-16 pb-24">
      <div className={`w-full max-w-lg transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Success Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5B7B6D] to-[#3d5a4e] flex items-center justify-center shadow-xl shadow-[#5B7B6D]/20 animate-bounce-slow">
              <FiCheck size={44} className="text-white" strokeWidth={3} />
            </div>
            <div className="absolute -inset-3 rounded-full border-2 border-[#5B7B6D]/20 animate-ping-slow" />
          </div>
        </div>

        {/* Order Number Badge */}
        {orderNum && (
          <div className="flex justify-center mb-5">
            <span className="px-4 py-1.5 bg-[#5B7B6D]/10 text-[#5B7B6D] rounded-full text-xs font-bold tracking-wider uppercase">
              {locale === 'ar' ? `طلب رقم: ${orderNum}` : `Order: ${orderNum}`}
            </span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-[#5B7B6D] to-[#3d5a4e] px-6 py-8 text-center text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {locale === 'ar' ? 'شكراً لطلبك!' : 'Thank You!'}
            </h1>
            <p className="text-white/80 text-sm">
              {locale === 'ar' ? 'تم استلام طلبك بنجاح' : 'Your order has been received successfully'}
            </p>
          </div>

          {/* Arabic Message */}
          <div className="px-6 pt-6 pb-4">
            <div className="bg-gradient-to-br from-[#f8faf9] to-[#f0f5f2] rounded-2xl p-5 border border-[#5B7B6D]/10">
              <p className="text-gray-700 text-sm leading-relaxed text-right" dir="rtl">
                عميلنا العزيز،
              </p>
              <p className="text-gray-600 text-xs leading-relaxed mt-2 text-right" dir="rtl">
                شكراً لثقتكم واختياركم &ldquo;أريج الأقحوان&rdquo; لتكون جزءاً من قصتكم. لقد تم اختيار كل زهرة في متجرنا بحب، وتغليف كل هدية بعناية فائقة لتدخل البهجة على قلوبكم وقلوب من تحبون. نتمنى أن يملأ هذا التنسيق يومكم بالجمال والعطر الفواح.
              </p>
              <p className="text-[#5B7B6D] text-xs font-semibold mt-3 text-right" dir="rtl">
                مع خالص الحب، فريق أريج الأقحوان 🌷
              </p>
            </div>
          </div>

          {/* English Message */}
          <div className="px-6 pb-4">
            <div className="bg-gradient-to-br from-[#faf8f5] to-[#f5f0eb] rounded-2xl p-5 border border-amber-100">
              <p className="text-gray-700 text-sm leading-relaxed" dir="ltr">
                Dear valued customer,
              </p>
              <p className="text-gray-600 text-xs leading-relaxed mt-2" dir="ltr">
                Thank you for your trust and for choosing &ldquo;Areej Al-Aqhwan&rdquo; to be part of your story. Every flower in our store has been selected with love, and every gift has been carefully wrapped to bring joy to your heart and to the hearts of those you cherish. We hope this arrangement fills your day with beauty and a delightful fragrance.
              </p>
              <p className="text-[#5B7B6D] text-xs font-semibold mt-3" dir="ltr">
                With sincere love, Areej Al-Aqhwan Team 🌷
              </p>
            </div>
          </div>

          {/* Order Summary (if order loaded) */}
          {order && (
            <div className="px-6 pb-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h3>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>{locale === 'ar' ? item.nameAr : item.name} ×{item.quantity}</span>
                      <span className="font-medium flex items-center gap-0.5">{(item.price * item.quantity).toFixed(2)} <SarIcon size={10} /></span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-lg font-bold text-[#5B7B6D] flex items-center gap-1">{order.total.toFixed(2)} <SarIcon size={14} /></span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pb-6 space-y-3">
            {order && (
              <button onClick={handleDownloadInvoice}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#5B7B6D] to-[#4a6a5c] text-white rounded-2xl font-semibold text-sm hover:shadow-lg hover:shadow-[#5B7B6D]/20 active:scale-[0.98] transition-all duration-200">
                <FiDownload size={16} /> {locale === 'ar' ? 'تحميل الفاتورة PDF' : 'Download Invoice PDF'}
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/"
                className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium text-sm hover:bg-gray-200 active:scale-[0.98] transition-all duration-200">
                <FiHome size={15} /> {locale === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
              <Link href="/products"
                className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium text-sm hover:bg-gray-200 active:scale-[0.98] transition-all duration-200">
                <FiShoppingBag size={15} /> {locale === 'ar' ? 'تسوق المزيد' : 'Shop More'}
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle branding */}
        <p className="text-center text-[10px] text-gray-300 mt-6 tracking-wider uppercase">Areej Al-Aqhwan &middot; Premium Flowers & Gifts</p>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-ping-slow { animation: ping-slow 2s ease-out infinite; }
      `}</style>
    </div>
  );
}
