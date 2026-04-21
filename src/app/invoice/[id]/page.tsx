'use client';

import { useEffect, useState, useRef, use, useCallback } from 'react';
import { FiDownload, FiPrinter } from 'react-icons/fi';
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
  storeNameEn: string;
  phone: string;
  address: string;
  vatEnabled: boolean;
  vatPercentage: number;
  logo: string;
}

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
};

const fmtNum = (n: number) => Number(n || 0).toFixed(2);

const SAR_CHAR = '\uF0EA';

export default function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([inv, sett]) => {
      if (inv && !inv.error) setInvoice(inv);
      setSettings(sett);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    QRCode.toDataURL('https://areejalaqhwan.com', { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then((url) => setQrDataUrl(url)).catch(console.error);
  }, []);

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

  const renderReceiptCanvas = useCallback(async (scale = 4) => {
    const el = printRef.current;
    if (!el) return null;
    const html2canvas = (await import('html2canvas')).default;
    if (document.fonts?.ready) await document.fonts.ready;
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
      return await html2canvas(clone, { scale, useCORS: true, backgroundColor: '#ffffff' });
    } finally {
      document.body.removeChild(clone);
    }
  }, []);

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      toast.loading('Generating PDF...', { id: 'pdf-dl' });
      const { jsPDF } = await import('jspdf');
      const canvas = await renderReceiptCanvas(4);
      if (!canvas) return;
      const pdfWidth = 80;
      const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, Math.max(70, pdfHeight)] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded', { id: 'pdf-dl' });
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('PDF generation failed', { id: 'pdf-dl' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-[#5B7B6D] border-t-transparent rounded-full" /></div>;
  }
  if (!invoice) {
    return <div className="flex items-center justify-center h-screen text-gray-500 text-sm">Invoice not found</div>;
  }

  const discountAmount = invoice.discountType === 'percentage' ? (invoice.subtotal * invoice.discount) / 100 : invoice.discount;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-center gap-2">
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            <FiDownload size={14} /> Download PDF
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <FiPrinter size={14} /> Print
          </button>
        </div>

        <div ref={printRef} className="bg-white rounded-xl shadow-sm border mx-auto" style={{ maxWidth: '302px', fontFamily: "'Courier New', monospace" }}>
          <div className="p-3" style={{ fontSize: '9px' }}>
            <div style={{ textAlign: 'center', marginBottom: '3px' }}>
              <img src={logoDataUrl || settings?.logo || '/logo.png'} alt="" style={{ maxWidth: '90px', maxHeight: '35px', margin: '0 auto', display: 'block' }} />
            </div>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Areej Al Aqhwan</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold' }}>أريج الأقحوان</div>
              {settings?.phone && <div style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '1px' }}>{settings.phone}</div>}
              {settings?.address && <div style={{ fontSize: '8px', fontWeight: 'bold' }}>{settings.address}</div>}
            </div>
            <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />
            <div style={{ fontSize: '8px', fontWeight: 'bold' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>Invoice # / رقم الفاتورة</span><span>{invoice.invoiceNumber}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>Date / التاريخ</span><span>{fmtDate(invoice.createdAt)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>Customer / العميل</span><span>{invoice.customerName}</span></div>
              {invoice.customerPhone && <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}><span>Phone / الجوال</span><span>{invoice.customerPhone}</span></div>}
            </div>
            <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />
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
                    <td style={{ fontSize: '8px', padding: '2px 1px', textAlign: 'left', fontWeight: 'bold' }}>{fmtNum(item.unitPrice)} <span style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span></td>
                    <td style={{ fontSize: '8px', padding: '2px 1px', textAlign: 'left', fontWeight: 'bold' }}>{fmtNum(item.total)} <span style={{ fontFamily: 'SaudiRiyalSymbol, sans-serif', fontWeight: 'bold' }}>{SAR_CHAR}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />
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
            {qrDataUrl && (
              <div style={{ textAlign: 'center', marginTop: '3px' }}>
                <img src={qrDataUrl} alt="QR" style={{ width: '50px', height: '50px', margin: '0 auto', display: 'block' }} />
                <div style={{ fontSize: '6px', color: '#555', marginTop: '1px' }}>areejalaqhwan.com</div>
              </div>
            )}
            <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0' }} />
            <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold' }}>
              <div>Thank you for your business!</div>
              <div style={{ marginTop: '1px' }}>شكراً لتعاملكم معنا</div>
              <div style={{ marginTop: '2px', fontSize: '7px', fontWeight: 'normal' }}>areejalaqhwan.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
