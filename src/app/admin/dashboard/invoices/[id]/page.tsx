'use client';

import { useEffect, useState, useRef, use, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiPrinter, FiArrowRight, FiDownload } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa6';
import Link from 'next/link';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { buildInvoiceWhatsAppMessage } from '@/lib/invoiceWhatsApp';
import { useT } from '@/lib/i18n';
import { toSaIntl } from '@/lib/phone';

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
  storeNameEn: string;
  phone: string;
  address: string;
  vatEnabled: boolean;
  vatPercentage: number;
  logo: string;
  invoiceWhatsappMessage: string;
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
  const t = useT();
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
  const autoPrintHandledRef = useRef(false);
  const autoShareHandledRef = useRef(false);

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
      toast.loading(t('جاري تجهيز الطباعة الحرارية...', 'Preparing thermal print...'), { id: 'thermal-print' });
      const canvas = await renderReceiptCanvas(4);
      if (!canvas) {
        toast.error(t('تعذر تجهيز الفاتورة للطباعة', 'Could not prepare invoice for printing'), { id: 'thermal-print' });
        return;
      }

      const imgData = canvas.toDataURL('image/png');
      const printableWidthMm = 72;
      const printableHeightMm = (canvas.height / canvas.width) * printableWidthMm;
      const w = window.open('', '_blank');

      if (!w) {
        toast.error(t('تعذر فتح نافذة الطباعة', 'Could not open print window'), { id: 'thermal-print' });
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
      toast.success(t('تم تجهيز الطباعة الحرارية', 'Thermal print ready'), { id: 'thermal-print' });
    } catch (err) {
      console.error('Thermal print error:', err);
      toast.error(t('فشل تجهيز الطباعة الحرارية', 'Failed to prepare thermal print'), { id: 'thermal-print' });
    }
  }, [renderReceiptCanvas]);

  // Build the fully-formatted WhatsApp message for this invoice
  const buildWaMessage = useCallback(() => {
    if (!invoice) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const invoiceLink = invoice._id ? `${origin}/invoice/${invoice._id}` : '';
    return buildInvoiceWhatsAppMessage({ ...invoice, invoiceLink }, settings || undefined);
  }, [invoice, settings]);

  const buildWaUrl = useCallback(() => {
    if (!invoice) return '#';
    const phone = toSaIntl(invoice.customerPhone || '');
    const msg = buildWaMessage();
    return phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }, [invoice, buildWaMessage]);

  // Generate a PDF blob from the rendered receipt
  const generatePdfBlob = useCallback(async (): Promise<{ blob: Blob; filename: string } | null> => {
    const inv = invoiceRef.current || invoice;
    if (!inv) return null;
    const { jsPDF } = await import('jspdf');
    const canvas = await renderReceiptCanvas(4);
    if (!canvas) return null;
    const pdfWidth = 80;
    const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, Math.max(70, pdfHeight)] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
    const blob = pdf.output('blob');
    return { blob, filename: `invoice-${inv.invoiceNumber}.pdf` };
  }, [invoice, renderReceiptCanvas]);

  // Download PDF only
  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      toast.loading(t('جاري إنشاء PDF...', 'Generating PDF...'), { id: 'pdf-dl' });
      const out = await generatePdfBlob();
      if (!out) throw new Error('pdf gen failed');
      const url = URL.createObjectURL(out.blob);
      const a = document.createElement('a');
      a.href = url; a.download = out.filename; document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success(t('تم تحميل PDF', 'PDF downloaded'), { id: 'pdf-dl' });
    } catch (err) {
      console.error('PDF error:', err);
      toast.error(t('فشل إنشاء PDF', 'PDF generation failed'), { id: 'pdf-dl' });
    }
  };

  // Share invoice via WhatsApp. Uses Web Share API with PDF attachment when available
  // (mobile -> WhatsApp receives the PDF as a document). Falls back to wa.me URL +
  // auto-downloading the PDF so the admin can drag-drop it into WhatsApp Web.
  const handleWhatsAppShare = useCallback(async () => {
    if (!invoice) return;
    try {
      toast.loading(t('جاري تجهيز الفاتورة...', 'Preparing invoice...'), { id: 'wa-share' });
      const pdfOut = await generatePdfBlob();
      const message = buildWaMessage();
      toast.dismiss('wa-share');

      // 1) Native share with file (mobile / supported desktops) - attaches PDF to WhatsApp
      if (pdfOut && typeof navigator !== 'undefined' && 'canShare' in navigator) {
        const file = new File([pdfOut.blob], pdfOut.filename, { type: 'application/pdf' });
        try {
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], text: message, title: `Invoice ${invoice.invoiceNumber}` });
            toast.success(t('تم المشاركة', 'Shared'));
            return;
          }
        } catch (shareErr) {
          const err = shareErr as { name?: string };
          if (err?.name === 'AbortError') return; // user cancelled
          console.warn('navigator.share failed, falling back:', shareErr);
        }
      }

      // 2) Desktop fallback: download PDF locally + open wa.me in a new tab
      if (pdfOut) {
        const url = URL.createObjectURL(pdfOut.blob);
        const a = document.createElement('a');
        a.href = url; a.download = pdfOut.filename; document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
      window.open(buildWaUrl(), '_blank', 'noopener,noreferrer');
      toast.success(t('تم تحميل PDF. اسحبه إلى محادثة الواتساب لإرفاقه', 'PDF downloaded — drop it into the WhatsApp chat that just opened.'), { id: 'wa-share', duration: 6000 });
    } catch (err) {
      console.error('WhatsApp share error:', err);
      toast.error(t('فشل المشاركة', 'Share failed'), { id: 'wa-share' });
      window.open(buildWaUrl(), '_blank', 'noopener,noreferrer');
    }
  }, [invoice, generatePdfBlob, buildWaMessage, buildWaUrl, t]);

  const clearAutoActionParam = useCallback((paramName: 'print' | 'share') => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete(paramName);
    const nextSearch = url.searchParams.toString();
    const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, []);

  useEffect(() => {
    autoPrintHandledRef.current = false;
    autoShareHandledRef.current = false;
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([inv, sett]) => {
      setInvoice(inv);
      setSettings(sett);
      invoiceRef.current = inv;
      settingsRef.current = sett;
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (loading || !invoice) return;

    const timeouts: number[] = [];

    if (searchParams.get('print') === 'true' && !autoPrintHandledRef.current) {
      autoPrintHandledRef.current = true;
      clearAutoActionParam('print');
      timeouts.push(window.setTimeout(() => handlePrintFn(), 800));
    }

    if (searchParams.get('share') === 'whatsapp' && !autoShareHandledRef.current) {
      autoShareHandledRef.current = true;
      clearAutoActionParam('share');
      timeouts.push(window.setTimeout(() => handleWhatsAppShare(), 1200));
    }

    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [clearAutoActionParam, handlePrintFn, handleWhatsAppShare, invoice, loading, searchParams]);

  if (loading || !invoice) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;
  }

  const discountAmount = invoice.discountType === 'percentage' ? (invoice.subtotal * invoice.discount) / 100 : invoice.discount;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard/invoices" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm">
          <FiArrowRight size={16} /> {t('العودة للفواتير', 'Back to invoices')}
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            <FiDownload size={14} /> PDF
          </button>
          <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
            <FaWhatsapp size={14} /> {t('واتساب', 'WhatsApp')}
          </button>
          <button onClick={handlePrintFn} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <FiPrinter size={14} /> {t('طباعة', 'Print')}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">{t('سيتم إرسال هذه الرسالة أيضًا إلى واتساب مع تحميل الفاتورة PDF', 'This message will also be sent to WhatsApp along with the invoice PDF')}</p>

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
