'use client';

import { useEffect, useState, useRef, use, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiPrinter, FiArrowRight, FiDownload } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa6';
import Link from 'next/link';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{ name: string; nameAr: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  discount: number;
  discountType: string;
  vat: number;
  vatAmount: number;
  total: number;
  notes: string;
  createdAt: string;
}

interface SettingsData {
  storeName: string;
  phone: string;
  address: string;
  vatEnabled: boolean;
  vatPercentage: number;
  logo: string;
}

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()}`;
};

const fmtNum = (n: number) => n.toFixed(2);

const SAR_CHAR = '\u00EA';

export default function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [fontDataUrl, setFontDataUrl] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  // Convert logo to data URL for PDF/print
  useEffect(() => {
    const logoSrc = settings?.logo || '/logo.png';
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0); setLogoDataUrl(canvas.toDataURL('image/png')); }
    };
    img.src = logoSrc;
  }, [settings]);

  // Generate QR code client-side
  useEffect(() => {
    QRCode.toDataURL('https://areejalaqhwan.com', { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrDataUrl).catch(console.error);
  }, []);

  // Load SAMA SAR font as data URL for print
  useEffect(() => {
    fetch('/fonts/saudiriyalsymbol.ttf')
      .then(res => res.arrayBuffer())
      .then(buf => {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        setFontDataUrl('data:font/truetype;base64,' + btoa(binary));
      })
      .catch(console.error);
  }, []);

  const handlePrintFn = useCallback(() => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const printStyles = `
@font-face { font-family: "SaudiRiyalSymbol"; src: url("${fontDataUrl}") format("truetype"); }
@page { size: 80mm 70mm; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Courier New", monospace; font-size: 9px; width: 72mm; margin: 0 auto; padding: 3mm; color: #000; direction: rtl; }
.sar { font-family: "SaudiRiyalSymbol", sans-serif; font-weight: bold; }
img { max-width: 100%; }
table { width: 100%; border-collapse: collapse; }
th, td { font-size: 8px; padding: 1px; }
th { border-bottom: 1px solid #000; }
`;
    w.document.write(`<html dir="rtl"><head><title>فاتورة</title><style>${printStyles}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }, [fontDataUrl]);

  // WhatsApp: download PDF + open WhatsApp with full message
  const handleWhatsApp = async () => {
    if (!invoice) return;

    const waMessage = [
      `فاتورة رقم: ${invoice.invoiceNumber}`,
      `العميل: ${invoice.customerName}`,
      `التاريخ: ${fmtDate(invoice.createdAt)}`,
      ``,
      ...invoice.items.map((item, i) => `${i+1}. ${item.nameAr || item.name} × ${item.quantity} = ${fmtNum(item.total)} ر.س`),
      ``,
      `الإجمالي: ${fmtNum(invoice.total)} ر.س`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `عميلنا العزيز،`,
      `شكراً لثقتكم واختياركم "أريج الأقحوان" لتكون جزءاً من قصتكم. لقد تم اختيار كل زهرة في متجرنا بحب، وتغليف كل هدية بعناية فائقة لتدخل البهجة على قلوبكم وقلوب من تحبون. نتمنى أن يملأ هذا التنسيق يومكم بالجمال والعطر الفواح.`,
      ``,
      `مع خالص الحب،`,
      `فريق أريج الأقحوان 🌷`,
      ``,
      `Dear valued customer,`,
      `Thank you for your trust and for choosing "Areej Al-Aqhawan" to be part of your story. Every flower in our store has been selected with love, and every gift has been carefully wrapped to bring joy to your heart and to the hearts of those you cherish. We hope this arrangement fills your day with beauty and a delightful fragrance.`,
      ``,
      `With sincere love,`,
      `Areej Al-Aqhawan Team 🌷`,
    ].join('\n');

    // Generate & download PDF first
    try {
      toast.loading('جاري إنشاء الفاتورة PDF...', { id: 'wa-pdf' });
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const el = printRef.current;
      if (el) {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const pdfWidth = 80;
        const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, Math.max(70, pdfHeight)] });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
        toast.success('تم تحميل الفاتورة PDF - أرفقها في واتساب', { id: 'wa-pdf', duration: 4000 });
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.dismiss('wa-pdf');
    }

    // Open WhatsApp with message
    const phone = invoice.customerPhone?.replace(/[^0-9]/g, '') || '';
    setTimeout(() => {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`, '_blank');
    }, 600);
  };

  // Download PDF only
  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      toast.loading('جاري إنشاء PDF...', { id: 'pdf-dl' });
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const el = printRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const pdfWidth = 80;
      const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, Math.max(70, pdfHeight)] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
      toast.success('تم تحميل PDF', { id: 'pdf-dl' });
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('فشل إنشاء PDF', { id: 'pdf-dl' });
    }
  };

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([inv, sett]) => {
      setInvoice(inv);
      setSettings(sett);
      setLoading(false);
      if (searchParams.get('print') === 'true') {
        setTimeout(() => handlePrintFn(), 800);
      }
    }).catch(() => setLoading(false));
  }, [id, searchParams, handlePrintFn]);

  if (loading || !invoice) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;
  }

  const discountAmount = invoice.discountType === 'percentage' ? (invoice.subtotal * invoice.discount) / 100 : invoice.discount;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard/invoices" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm">
          <FiArrowRight size={16} /> العودة للفواتير
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            <FiDownload size={14} /> PDF
          </button>
          <button onClick={handleWhatsApp} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
            <FaWhatsapp size={14} /> واتساب
          </button>
          <button onClick={handlePrintFn} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <FiPrinter size={14} /> طباعة
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">سيتم إرسال هذه الرسالة أيضًا إلى واتساب مع تحميل الفاتورة PDF</p>

      {/* Thermal receipt preview - 80mm x 70mm */}
      <div ref={printRef} className="bg-white rounded-xl shadow-sm border mx-auto" style={{ maxWidth: '302px', fontFamily: "'Courier New', monospace" }}>
        <div className="p-3" style={{ fontSize: '9px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '3px' }}>
            <img src={logoDataUrl || settings?.logo || '/logo.png'} alt="" style={{ maxWidth: '90px', maxHeight: '35px', margin: '0 auto', display: 'block' }} />
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{settings?.storeName || 'أريج الأخوان'}</div>
            {settings?.phone && <div style={{ fontSize: '8px', color: '#333' }}>{settings.phone}</div>}
            {settings?.address && <div style={{ fontSize: '8px', color: '#333' }}>{settings.address}</div>}
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />

          {/* Invoice info */}
          <div style={{ fontSize: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0' }}><span>رقم الفاتورة:</span><span>{invoice.invoiceNumber}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0' }}><span>التاريخ:</span><span>{fmtDate(invoice.createdAt)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0' }}><span>العميل:</span><span>{invoice.customerName}</span></div>
            {invoice.customerPhone && <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0' }}><span>الجوال:</span><span dir="ltr">{invoice.customerPhone}</span></div>}
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />

          {/* Items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ fontSize: '8px', textAlign: 'right', padding: '2px 1px', borderBottom: '1px solid #000' }}>المنتج</th>
                <th style={{ fontSize: '8px', textAlign: 'center', padding: '2px 1px', borderBottom: '1px solid #000', width: '22px' }}>كمية</th>
                <th style={{ fontSize: '8px', textAlign: 'left', padding: '2px 1px', borderBottom: '1px solid #000', width: '45px' }}>السعر</th>
                <th style={{ fontSize: '8px', textAlign: 'left', padding: '2px 1px', borderBottom: '1px solid #000', width: '45px' }}>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '8px', padding: '1px' }}>{item.nameAr || item.name}</td>
                  <td style={{ fontSize: '8px', padding: '1px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ fontSize: '8px', padding: '1px', textAlign: 'left' }}>{fmtNum(item.unitPrice)}</td>
                  <td style={{ fontSize: '8px', padding: '1px', textAlign: 'left', fontWeight: 600 }}>{fmtNum(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />

          {/* Totals with SAMA SAR icon */}
          <div style={{ fontSize: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
              <span>المجموع الفرعي</span>
              <span>{fmtNum(invoice.subtotal)} <span className="sar" style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span></span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', color: 'red' }}>
                <span>الخصم</span>
                <span>-{fmtNum(discountAmount)} <span className="sar" style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span></span>
              </div>
            )}
            {invoice.vatAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                <span>ضريبة ({invoice.vat}%)</span>
                <span>{fmtNum(invoice.vatAmount)} <span className="sar" style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span></span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', borderTop: '1px solid #000', paddingTop: '2px', marginTop: '2px' }}>
              <span>الإجمالي</span>
              <span>{fmtNum(invoice.total)} <span className="sar" style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span></span>
            </div>
          </div>

          {invoice.notes && (
            <>
              <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />
              <div style={{ fontSize: '7px', padding: '2px', background: '#f5f5f5' }}>
                <strong>ملاحظات:</strong> {invoice.notes}
              </div>
            </>
          )}

          {/* QR Code - client-side generated */}
          {qrDataUrl && (
            <div style={{ textAlign: 'center', marginTop: '3px' }}>
              <img src={qrDataUrl} alt="QR" style={{ width: '50px', height: '50px', margin: '0 auto', display: 'block' }} />
              <div style={{ fontSize: '6px', color: '#555', marginTop: '1px' }}>areejalaqhwan.com</div>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '7px', color: '#555' }}>
            <div>شكراً لتعاملكم معنا</div>
            <div style={{ marginTop: '1px' }}>Thank you for your business</div>
          </div>
        </div>
      </div>
    </div>
  );
}
