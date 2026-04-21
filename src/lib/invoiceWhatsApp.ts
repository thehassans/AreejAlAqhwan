export interface InvoiceWhatsAppItem {
  name?: string;
  nameAr?: string;
  quantity?: number;
  total?: number;
}

export interface InvoiceWhatsAppData {
  customerName: string;
  invoiceNumber: string;
  createdAt: string;
  total: number;
  subtotal?: number;
  discount?: number;
  discountType?: string;
  vat?: number;
  vatAmount?: number;
  items?: InvoiceWhatsAppItem[];
  invoiceLink?: string;
}

export interface InvoiceWhatsAppSettings {
  storeName?: string;
  storeNameEn?: string;
  invoiceWhatsappMessage?: string;
}

export const DEFAULT_INVOICE_WHATSAPP_MESSAGE = `Dear {customerName},

Thank you for your trust and for choosing "{storeNameEn}" to be a part of your story. Every flower in our store has been lovingly selected, and every gift carefully packaged to bring joy to you and your loved ones. We hope this arrangement fills your day with beauty and fragrance.

With love,
The {storeNameEn} Team 🌷

────────────────

عزيزي/عزيزتي {customerName}،

نشكركم على ثقتكم واختياركم "{storeName}" لتكون جزءًا من قصتكم. كل زهرة في متجرنا مختارة بعناية، وكل هدية مُغلفة بحرص لتُضفي البهجة على يومكم ويوم أحبائكم. نتمنى أن تُملأ هذه الباقة يومكم بالجمال والعبير.

مع خالص الحب،
فريق {storeName} 🌷

────────────────
فاتورة رقم: {invoiceNumber}
التاريخ: {date}
{items}
{discountLine}
{vatLine}
الإجمالي: {total} ر.س
{invoiceLinkLine}`;

const formatDate = (value: string) => {
  const dt = new Date(value);
  return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
};

const formatAmount = (value?: number) => Number(value || 0).toFixed(2);

const getDiscountAmount = (invoice: InvoiceWhatsAppData) => {
  const discount = invoice.discount || 0;
  if (invoice.discountType === 'percentage') {
    return ((invoice.subtotal || 0) * discount) / 100;
  }
  return discount;
};

export const buildInvoiceWhatsAppMessage = (
  invoice: InvoiceWhatsAppData,
  settings?: InvoiceWhatsAppSettings,
) => {
  const template = settings?.invoiceWhatsappMessage?.trim() || DEFAULT_INVOICE_WHATSAPP_MESSAGE;
  const storeName = settings?.storeName || 'أريج الأقحوان';
  const storeNameEn = settings?.storeNameEn || 'Areej Al Aqhwan';
  const discountAmount = getDiscountAmount(invoice);
  const items = invoice.items?.length
    ? invoice.items.map((item, index) => `${index + 1}. ${item.nameAr || item.name || ''} × ${item.quantity || 0} = ${formatAmount(item.total)} ر.س`).join('\n')
    : '';

  const replacements: Record<string, string> = {
    customerName: invoice.customerName || '',
    invoiceNumber: invoice.invoiceNumber || '',
    date: formatDate(invoice.createdAt),
    total: formatAmount(invoice.total),
    subtotal: formatAmount(invoice.subtotal),
    discount: formatAmount(discountAmount),
    vat: String(invoice.vat || 0),
    vatAmount: formatAmount(invoice.vatAmount),
    items,
    storeName,
    storeNameEn,
    discountLine: discountAmount > 0 ? `الخصم: ${formatAmount(discountAmount)} ر.س` : '',
    vatLine: (invoice.vatAmount || 0) > 0 ? `ضريبة (${invoice.vat || 0}%): ${formatAmount(invoice.vatAmount)} ر.س` : '',
    invoiceLink: invoice.invoiceLink || '',
    invoiceLinkLine: invoice.invoiceLink
      ? `\n\nعرض / تحميل الفاتورة PDF:\nView / Download invoice PDF:\n${invoice.invoiceLink}`
      : '',
  };

  let message = template;
  Object.entries(replacements).forEach(([key, value]) => {
    message = message.split(`{${key}}`).join(value);
  });

  return message.replace(/\n{3,}/g, '\n\n').trim();
};
