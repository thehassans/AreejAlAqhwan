'use client';

import { useEffect, useState, useRef, use, useCallback, useMemo } from 'react';
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
  instagram: string; instagramEnabled: boolean;
  facebook: string; facebookEnabled: boolean;
  twitter: string; twitterEnabled: boolean;
  tiktok: string; tiktokEnabled: boolean;
  snapchat: string; snapchatEnabled: boolean;
  pinterest: string; pinterestEnabled: boolean;
}

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()}`;
};

const fmtNum = (n: number) => n.toFixed(2);

const SAR_CHAR = '\uF0EA';

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
  const invoiceRef = useRef<InvoiceData | null>(null);
  const settingsRef = useRef<SettingsData | null>(null);
  const qrRef = useRef<string>('');
  const logoRef = useRef<string>('');

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
      if (ctx) { ctx.drawImage(img, 0, 0); const url = canvas.toDataURL('image/png'); setLogoDataUrl(url); logoRef.current = url; }
    };
    img.src = logoSrc;
  }, [settings]);

  // Generate QR code client-side
  useEffect(() => {
    QRCode.toDataURL('https://areejalaqhwan.com', { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(url => { setQrDataUrl(url); qrRef.current = url; }).catch(console.error);
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

  const renderReceiptCanvas = useCallback(async (scale = 4) => {
    const el = printRef.current;
    if (!el) return null;
    const html2canvas = (await import('html2canvas')).default;
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    const clone = el.cloneNode(true) as HTMLDivElement;

    clone.style.position = 'fixed';
    clone.style.left = '-10000px';
    clone.style.top = '0';
    clone.style.margin = '0';
    clone.style.maxWidth = '302px';
    clone.style.width = '302px';
    clone.style.border = 'none';
    clone.style.borderRadius = '0';
    clone.style.boxShadow = 'none';
    clone.style.background = '#ffffff';
    clone.style.overflow = 'visible';

    document.body.appendChild(clone);

    try {
      return await html2canvas(clone, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
    } finally {
      document.body.removeChild(clone);
    }
  }, []);

  const handlePrintFn = useCallback(async () => {
    const inv = invoiceRef.current;
    if (!inv) return;

    try {
      toast.loading('جاري تجهيز الطباعة الحرارية...', { id: 'thermal-print' });
      const canvas = await renderReceiptCanvas(4);
      if (!canvas) {
        toast.error('تعذر تجهيز الفاتورة للطباعة', { id: 'thermal-print' });
        return;
      }

      const imgData = canvas.toDataURL('image/png');
      const printableWidthMm = 72;
      const printableHeightMm = (canvas.height / canvas.width) * printableWidthMm;
      const w = window.open('', '_blank');

      if (!w) {
        toast.error('تعذر فتح نافذة الطباعة', { id: 'thermal-print' });
        return;
      }

      w.document.write(`
        <html>
          <head>
            <meta charset="UTF-8">
            <title>فاتورة</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              html, body { margin: 0; padding: 0; width: 80mm; background: #ffffff; }
              body { display: flex; justify-content: center; align-items: flex-start; }
              img { display: block; width: ${printableWidthMm}mm; height: ${printableHeightMm}mm; image-rendering: crisp-edges; image-rendering: -webkit-optimize-contrast; }
            </style>
          </head>
          <body>
            <img src="${imgData}" alt="Invoice receipt" />
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 250);
              };
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      w.document.close();
      toast.success('تم تجهيز الطباعة الحرارية', { id: 'thermal-print' });
    } catch (err) {
      console.error('Thermal print error:', err);
      toast.error('فشل تجهيز الطباعة الحرارية', { id: 'thermal-print' });
    }
  }, [renderReceiptCanvas]);

  // Compute WhatsApp URL as derived value so it can be used directly in an <a> href
  const whatsappUrl = useMemo(() => {
    if (!invoice) return '#';
    const waMessage = [
      `Dear ${invoice.customerName},`,
      ``,
      `Thank you for your trust and for choosing "Areej Al-Aqahwan" to be a part of your story. Every flower in our store has been lovingly selected, and every gift carefully packaged to bring joy to you and your loved ones. We hope this arrangement fills your day with beauty and fragrance.`,
      ``,
      `With love,`,
      `The Areej Al-Aqahwan Team 🌷`,
      ``,
      `────────────────`,
      ``,
      `عزيزي/عزيزتي ${invoice.customerName}،`,
      ``,
      `نشكركم على ثقتكم واختياركم "أريج الأقهوان" لتكون جزءًا من قصتكم. كل زهرة في متجرنا مختارة بعناية، وكل هدية مُغلفة بحرص لتُضفي البهجة على يومكم ويوم أحبائكم. نتمنى أن تُملأ هذه الباقة يومكم بالجمال والعبير.`,
      ``,
      `مع خالص الحب،`,
      `فريق أريج الأقهوان 🌷`,
      ``,
      `────────────────`,
      `فاتورة رقم: ${invoice.invoiceNumber}`,
      `التاريخ: ${fmtDate(invoice.createdAt)}`,
      ``,
      ...invoice.items.map((item, i) => `${i+1}. ${item.nameAr || item.name} × ${item.quantity} = ${fmtNum(item.total)} ر.س`),
      ``,
      invoice.vatAmount > 0 ? `ضريبة (${invoice.vat}%): ${fmtNum(invoice.vatAmount)} ر.س` : null,
      `الإجمالي: ${fmtNum(invoice.total)} ر.س`,
    ].filter(Boolean).join('\n');

    let phone = invoice.customerPhone?.replace(/[^0-9]/g, '') || '';
    if (phone.startsWith('0')) phone = '966' + phone.slice(1);
    return phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
  }, [invoice]);

  // Download PDF only
  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      toast.loading('جاري إنشاء PDF...', { id: 'pdf-dl' });
      const { jsPDF } = await import('jspdf');
      const canvas = await renderReceiptCanvas(4);
      if (!canvas) return;
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
      invoiceRef.current = inv;
      settingsRef.current = sett;
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
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
            <FaWhatsapp size={14} /> واتساب
          </a>
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
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Areej Al Aqhwan</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>أريج الأقحوان</div>
            {settings?.phone && <div style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '1px' }}>{settings.phone}</div>}
            {settings?.address && <div style={{ fontSize: '8px', fontWeight: 'bold' }}>{settings.address}</div>}
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />

          {/* Invoice info - bilingual */}
          <div style={{ fontSize: '8px', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>Invoice # / رقم الفاتورة</span><span>{invoice.invoiceNumber}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>Date / التاريخ</span><span>{fmtDate(invoice.createdAt)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>Customer / العميل</span><span>{invoice.customerName}</span></div>
            {invoice.customerPhone && <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>Phone / الجوال</span><span>{invoice.customerPhone}</span></div>}
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />

          {/* Items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ fontSize: '8px', textAlign: 'left', padding: '2px 1px', borderBottom: '2px solid #000' }}>Item / المنتج</th>
                <th style={{ fontSize: '8px', textAlign: 'center', padding: '2px 1px', borderBottom: '2px solid #000', width: '22px' }}>Qty</th>
                <th style={{ fontSize: '8px', textAlign: 'left', padding: '2px 1px', borderBottom: '2px solid #000', width: '50px' }}>Price</th>
                <th style={{ fontSize: '8px', textAlign: 'left', padding: '2px 1px', borderBottom: '2px solid #000', width: '50px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '8px', padding: '2px 1px', fontWeight: 'bold' }}>
                    {item.name && item.nameAr ? `${item.name} / ${item.nameAr}` : (item.name || item.nameAr)}
                  </td>
                  <td style={{ fontSize: '8px', padding: '2px 1px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                  <td style={{ fontSize: '8px', padding: '2px 1px', textAlign: 'left', fontWeight: 'bold' }}>
                    {fmtNum(item.unitPrice)} <span style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span>
                  </td>
                  <td style={{ fontSize: '8px', padding: '2px 1px', textAlign: 'left', fontWeight: 'bold' }}>
                    {fmtNum(item.total)} <span style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />

          {/* Totals - bilingual */}
          <div style={{ fontSize: '8px', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>Subtotal / المجموع الفرعي</span>
              <span>{fmtNum(invoice.subtotal)} <span style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span></span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: 'red' }}>
                <span>Discount / الخصم</span>
                <span>-{fmtNum(discountAmount)} <span style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span></span>
              </div>
            )}
            {invoice.vatAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>VAT / ضريبة ({invoice.vat}%)</span>
                <span>{fmtNum(invoice.vatAmount)} <span style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span></span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px', borderTop: '2px solid #000', paddingTop: '3px', marginTop: '3px' }}>
              <span>TOTAL / الإجمالي</span>
              <span>{fmtNum(invoice.total)} <span style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold', fontSize: '12px' }}>{SAR_CHAR}</span></span>
            </div>
          </div>

          {invoice.notes && (
            <>
              <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />
              <div style={{ fontSize: '7px', padding: '2px', background: '#f5f5f5' }}>
                <strong>Notes:</strong> {invoice.notes}
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

          {/* Footer - bilingual */}
          <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold' }}>
            <div>Thank you for your business!</div>
            <div style={{ marginTop: '1px' }}>شكراً لتعاملكم معنا</div>
            <div style={{ marginTop: '2px', fontSize: '7px', fontWeight: 'normal' }}>areejalaqhwan.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
