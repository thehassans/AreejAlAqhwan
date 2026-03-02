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

  const handlePrintFn = useCallback(() => {
    const inv = invoiceRef.current;
    const sett = settingsRef.current;
    if (!inv) return;
    const w = window.open('', '_blank');
    if (!w) return;

    const discAmt = inv.discountType === 'percentage'
      ? (inv.subtotal * inv.discount) / 100
      : inv.discount;

    const css = `
@page { size: 80mm auto; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Courier New', Courier, monospace; font-size: 9px; width: 72mm; margin: 0 auto; padding: 3mm 4mm; color: #000; font-weight: bold; }
img { display: block; margin: 0 auto; }
table { width: 100%; border-collapse: collapse; }
td, th { font-size: 8px; font-weight: bold; padding: 2px 3px; vertical-align: top; }
.hdr th { border-bottom: 2px solid #000; text-align: left; }
.hdr th.r { text-align: right; }
.info td.r { text-align: right; }
.tot td.r { text-align: right; }
.tot .line td { border-top: 2px solid #000; font-size: 10px; padding-top: 3px; }
hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
.center { text-align: center; }
`;

    const itemRows = inv.items.map(it =>
      `<tr>
        <td>${it.name || it.nameAr || '-'}</td>
        <td style="text-align:center;width:20px">${it.quantity}</td>
        <td style="text-align:right;width:52px">${fmtNum(it.unitPrice)} SR</td>
        <td style="text-align:right;width:52px">${fmtNum(it.total)} SR</td>
      </tr>`
    ).join('');

    const html = `
      <div class="center" style="margin-bottom:5px">
        ${logoRef.current ? `<img src="${logoRef.current}" style="max-width:80px;max-height:32px;margin-bottom:3px">` : ''}
        <div style="font-size:12px">Areej Al Aqhwan</div>
        ${sett?.phone ? `<div style="font-size:8px">${sett.phone}</div>` : ''}
        ${sett?.address ? `<div style="font-size:7px">${sett.address}</div>` : ''}
      </div>
      <hr>
      <table class="info">
        <tr><td style="width:55%">Invoice #</td><td class="r">${inv.invoiceNumber}</td></tr>
        <tr><td>Date</td><td class="r">${fmtDate(inv.createdAt)}</td></tr>
        <tr><td>Customer</td><td class="r">${inv.customerName}</td></tr>
        ${inv.customerPhone ? `<tr><td>Phone</td><td class="r">${inv.customerPhone}</td></tr>` : ''}
      </table>
      <hr>
      <table>
        <thead class="hdr"><tr>
          <th>Item</th>
          <th style="text-align:center;width:20px">Qty</th>
          <th class="r" style="width:52px">Price</th>
          <th class="r" style="width:52px">Total</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <hr>
      <table class="tot">
        <tr><td style="width:60%">Subtotal</td><td class="r">${fmtNum(inv.subtotal)} SR</td></tr>
        ${discAmt > 0 ? `<tr style="color:red"><td>Discount</td><td class="r">- ${fmtNum(discAmt)} SR</td></tr>` : ''}
        ${inv.vatAmount > 0 ? `<tr><td>VAT (${inv.vat}%)</td><td class="r">${fmtNum(inv.vatAmount)} SR</td></tr>` : ''}
        <tr class="line"><td>TOTAL</td><td class="r">${fmtNum(inv.total)} SR</td></tr>
      </table>
      ${inv.notes ? `<hr><div style="font-size:7px">Notes: ${inv.notes}</div>` : ''}
      ${qrRef.current ? `<div class="center" style="margin-top:5px"><img src="${qrRef.current}" style="width:48px;height:48px"><div style="font-size:6px;margin-top:1px">areejalaqhwan.com</div></div>` : ''}
      <hr>
      <div class="center" style="font-size:8px">
        <div>Thank you for your business!</div>
        <div style="font-size:7px;margin-top:1px">areejalaqhwan.com</div>
      </div>
    `;

    w.document.write(`<html><head><title>Invoice</title><style>${css}</style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  }, []);

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
