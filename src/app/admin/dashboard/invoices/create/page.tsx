'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiPrinter, FiSearch, FiX, FiChevronDown, FiChevronUp, FiMove } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import SarIcon from '@/components/SarIcon';
import { buildInvoiceWhatsAppMessage } from '@/lib/invoiceWhatsApp';

interface InvoiceItem {
  name: string;
  nameAr: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyTier: string;
  loyaltyPoints: number;
}

const tierColors: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-700 border-orange-200',
  silver: 'bg-gray-100 text-gray-600 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  platinum: 'bg-purple-100 text-purple-700 border-purple-200',
};
const tierLabels: Record<string, string> = {
  bronze: '🥉 برونزي', silver: '🥈 فضي', gold: '🥇 ذهبي', platinum: '💎 بلاتيني',
};
const tierEmoji: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎',
};

interface CatalogProduct {
  _id: string;
  name: string;
  nameAr: string;
  price: number;
  discount: number;
  discountType: string;
  category: string;
  images: string[];
  inStock: boolean;
}

interface SettingsData {
  vatEnabled: boolean;
  vatPercentage: number;
  storeName: string;
  storeNameEn?: string;
  phone: string;
  address: string;
  invoicePrefix?: string;
  invoiceNextNumber?: number;
  invoiceWhatsappMessage?: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ name: '', nameAr: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [notes, setNotes] = useState('');
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<number>(0);
  const [pickerSearch, setPickerSearch] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [dragOverRow, setDragOverRow] = useState<number | null>(null);
  const [dragOverList, setDragOverList] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((s) => {
      setSettings(s);
      const prefix = s?.invoicePrefix || 'INV';
      const num = s?.invoiceNextNumber || 1;
      setInvoiceNumber(`${prefix}-${String(num).padStart(4, '0')}`);
    }).catch(console.error);
    fetch('/api/customers').then(r => r.json()).then(data => setAllCustomers(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('/api/products').then(r => r.json()).then(data => setCatalog(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (customerPhone.trim().length < 2) { setPhoneSuggestions([]); setShowSuggestions(false); return; }
    const matches = allCustomers.filter(c => c.phone.includes(customerPhone.trim()) || c.name.toLowerCase().includes(customerPhone.toLowerCase())).slice(0, 5);
    setPhoneSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [customerPhone, allCustomers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (phoneRef.current && !phoneRef.current.contains(e.target as Node)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name); setCustomerPhone(c.phone); setCustomerEmail(c.email || '');
    setSelectedCustomer(c); setShowSuggestions(false);
  };

  const openPicker = (index: number) => { setPickerTarget(index); setPickerSearch(''); setShowPicker(true); };

  const effectivePriceOf = (p: CatalogProduct) => (p.discount > 0
    ? (p.discountType === 'percentage' ? p.price * (1 - p.discount / 100) : Math.max(0, p.price - p.discount))
    : p.price);

  const selectFromCatalog = (p: CatalogProduct) => {
    const effectivePrice = effectivePriceOf(p);
    const newItems = [...items];
    newItems[pickerTarget] = { ...newItems[pickerTarget], name: p.name, nameAr: p.nameAr, unitPrice: effectivePrice, total: newItems[pickerTarget].quantity * effectivePrice };
    setItems(newItems);
    setShowPicker(false);
  };

  // ---- Drag & drop from catalog to items ----
  const onProductDragStart = (e: React.DragEvent, p: CatalogProduct) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-invoice-product', JSON.stringify({ id: p._id }));
    e.dataTransfer.setData('text/plain', p.nameAr || p.name);
  };

  const readDroppedProduct = (e: React.DragEvent): CatalogProduct | null => {
    const raw = e.dataTransfer.getData('application/x-invoice-product');
    if (!raw) return null;
    try {
      const { id } = JSON.parse(raw) as { id: string };
      return catalog.find((p) => p._id === id) || null;
    } catch { return null; }
  };

  const replaceItemWithProduct = (index: number, p: CatalogProduct) => {
    const effectivePrice = effectivePriceOf(p);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: p.name, nameAr: p.nameAr, unitPrice: effectivePrice, total: next[index].quantity * effectivePrice };
      return next;
    });
  };

  const appendItemFromProduct = (p: CatalogProduct) => {
    const effectivePrice = effectivePriceOf(p);
    setItems((prev) => {
      // If last row is empty, fill it instead of appending
      const last = prev[prev.length - 1];
      if (last && !last.name && !last.nameAr && last.unitPrice === 0) {
        const next = [...prev];
        next[next.length - 1] = { name: p.name, nameAr: p.nameAr, quantity: last.quantity || 1, unitPrice: effectivePrice, total: (last.quantity || 1) * effectivePrice };
        return next;
      }
      return [...prev, { name: p.name, nameAr: p.nameAr, quantity: 1, unitPrice: effectivePrice, total: effectivePrice }];
    });
  };

  const handleRowDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverRow(null);
    setDragOverList(false);
    const p = readDroppedProduct(e);
    if (p) replaceItemWithProduct(index, p);
  };

  const handleListDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverList(false);
    const p = readDroppedProduct(e);
    if (p) appendItemFromProduct(p);
  };

  const addItem = () => setItems([...items, { name: '', nameAr: '', quantity: 1, unitPrice: 0, total: 0 }]);

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    const item = newItems[index];
    if (field === 'name') item.name = value as string;
    else if (field === 'nameAr') item.nameAr = value as string;
    else if (field === 'quantity') item.quantity = value as number;
    else if (field === 'unitPrice') item.unitPrice = value as number;
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = item.quantity * item.unitPrice;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const rawDiscountAmount = discountType === 'percentage'
    ? (subtotal * discount) / 100
    : discount;
  const discountAmount = Math.min(subtotal, Math.max(0, rawDiscountAmount));
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const vatAmount = settings?.vatEnabled ? (discountedSubtotal * (settings.vatPercentage || 15)) / 100 : 0;
  const total = discountedSubtotal + vatAmount;

  const handleSave = async (opts: { print?: boolean; whatsapp?: boolean } = {}) => {
    const { print: andPrint = false, whatsapp: andWhatsapp = false } = opts;
    if (!customerName.trim()) { toast.error('يرجى إدخال اسم العميل'); return; }
    if (items.some((i) => !i.nameAr && !i.name)) { toast.error('يرجى إدخال اسم المنتج'); return; }
    if (andWhatsapp && !customerPhone.trim()) { toast.error('يرجى إدخال رقم جوال العميل لإرسال الفاتورة عبر واتساب'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber, customerName, customerPhone, customerEmail,
          items, subtotal, discount, discountType,
          vat: settings?.vatPercentage || 0, vatAmount, total, notes,
        }),
      });
      if (res.ok) {
        const inv = await res.json();
        toast.success('تم إنشاء الفاتورة بنجاح');
        if (andWhatsapp) {
          const message = buildInvoiceWhatsAppMessage(
            {
              customerName: inv.customerName || customerName,
              invoiceNumber: inv.invoiceNumber || invoiceNumber,
              createdAt: inv.createdAt || new Date().toISOString(),
              total: inv.total ?? total,
              subtotal: inv.subtotal ?? subtotal,
              discount: inv.discount ?? discount,
              discountType: inv.discountType ?? discountType,
              vat: inv.vat ?? (settings?.vatPercentage || 0),
              vatAmount: inv.vatAmount ?? vatAmount,
              items: (inv.items ?? items) as InvoiceItem[],
            },
            settings || undefined,
          );
          let phone = (inv.customerPhone || customerPhone).replace(/[^0-9]/g, '');
          if (phone.startsWith('0')) phone = '966' + phone.slice(1);
          const waUrl = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;
          window.open(waUrl, '_blank', 'noopener,noreferrer');
          router.push('/admin/dashboard/invoices');
        } else if (andPrint) {
          router.push(`/admin/dashboard/invoices/${inv._id}?print=true`);
        } else {
          router.push('/admin/dashboard/invoices');
        }
      } else {
        toast.error('فشل إنشاء الفاتورة');
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const filteredCatalog = catalog.filter(p =>
    p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    p.nameAr.includes(pickerSearch) ||
    p.category.includes(pickerSearch)
  );

  const filteredCatalogPanel = catalog.filter(p =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.nameAr.includes(catalogSearch) ||
    p.category.includes(catalogSearch)
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800">إنشاء فاتورة جديدة</h1>

      {/* Product picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800">اختر منتجاً من الكتالوج</h3>
              <button onClick={() => setShowPicker(false)} className="p-1 hover:bg-gray-100 rounded-lg"><FiX size={18} /></button>
            </div>
            <div className="p-3 border-b">
              <div className="relative">
                <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input autoFocus type="text" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                  placeholder="ابحث عن منتج..." dir="rtl"
                  className="w-full px-4 py-2 pr-9 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#5B7B6D] outline-none" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredCatalog.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">لا توجد منتجات مطابقة</div>
              ) : filteredCatalog.map(p => {
                const effectivePrice = p.discount > 0
                  ? (p.discountType === 'percentage' ? p.price * (1 - p.discount / 100) : Math.max(0, p.price - p.discount))
                  : p.price;
                return (
                  <button key={p._id} onClick={() => selectFromCatalog(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#5B7B6D]/5 border-b last:border-0 text-right transition-colors">
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{p.nameAr}</p>
                      <p className="text-xs text-gray-400 truncate">{p.name} · {p.category}</p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      {p.discount > 0 && (
                        <p className="text-xs text-gray-400 line-through">{p.price.toFixed(2)}</p>
                      )}
                      <p className="text-sm font-bold text-[#5B7B6D]">{effectivePrice.toFixed(2)} ر.س</p>
                      {p.discount > 0 && (
                        <p className="text-xs text-red-500">خصم {p.discountType === 'percentage' ? `${p.discount}%` : `${p.discount} ر.س`}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">فاتورة رقم: {invoiceNumber}</h2>
        </div>

        {selectedCustomer && (
          <div className={`rounded-xl border p-4 ${tierColors[selectedCustomer.loyaltyTier] || 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tierEmoji[selectedCustomer.loyaltyTier]}</span>
                <div>
                  <p className="font-bold text-sm">عميل {tierLabels[selectedCustomer.loyaltyTier]} — {selectedCustomer.name}</p>
                  <p className="text-xs mt-0.5 opacity-80">{selectedCustomer.totalOrders} طلب سابق · إجمالي الإنفاق: {selectedCustomer.totalSpent.toFixed(2)} ر.س · {selectedCustomer.loyaltyPoints} نقطة ولاء</p>
                </div>
              </div>
              <button onClick={() => { setSelectedCustomer(null); }} className="text-xs underline opacity-60 hover:opacity-100">إلغاء التحديد</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div ref={phoneRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
            <div className="relative">
              <input type="text" value={customerPhone}
                onChange={(e) => { setCustomerPhone(e.target.value); setSelectedCustomer(null); }}
                onFocus={() => phoneSuggestions.length > 0 && setShowSuggestions(true)}
                className="w-full px-4 py-2 pr-9 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" placeholder="05xxxxxxxx" />
              <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {showSuggestions && (
              <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b text-xs text-gray-500 font-medium">عملاء مطابقون</div>
                {phoneSuggestions.map(c => (
                  <button key={c._id} onMouseDown={() => selectCustomer(c)} className="w-full text-right px-3 py-3 hover:bg-[#5B7B6D]/5 transition-colors border-b last:border-0">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-semibold text-gray-800">{c.name}</p><p className="text-xs text-gray-500" dir="ltr">{c.phone}</p></div>
                      <div className="text-left">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium border ${tierColors[c.loyaltyTier]}`}>{tierEmoji[c.loyaltyTier]} {tierLabels[c.loyaltyTier]}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{c.totalOrders} طلب · {c.loyaltyPoints} نقطة</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" dir="ltr" />
          </div>
        </div>

        {/* Catalog drag-and-drop panel */}
        <div className="border border-dashed border-[#5B7B6D]/30 rounded-xl bg-[#5B7B6D]/[0.03]">
          <button
            type="button"
            onClick={() => setCatalogOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#5B7B6D]"
          >
            <span className="flex items-center gap-2"><FiMove size={14} /> اسحب منتجاً من الكتالوج وأفلته على صف أو هنا لإضافته</span>
            {catalogOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
          {catalogOpen && (
            <div className="px-4 pb-4 space-y-3">
              <div className="relative">
                <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="ابحث في المنتجات..."
                  className="w-full px-4 py-2 pr-9 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#5B7B6D]/30 outline-none"
                />
              </div>
              {filteredCatalogPanel.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">لا توجد منتجات مطابقة</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {filteredCatalogPanel.slice(0, 40).map((p) => (
                    <div
                      key={p._id}
                      draggable
                      onDragStart={(e) => onProductDragStart(e, p)}
                      onClick={() => appendItemFromProduct(p)}
                      title="اسحب أو انقر للإضافة"
                      className="shrink-0 w-36 bg-white border border-gray-200 rounded-xl p-2 cursor-grab active:cursor-grabbing hover:border-[#5B7B6D] hover:shadow-md transition"
                    >
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-full h-20 rounded-lg object-cover mb-2" />
                      ) : (
                        <div className="w-full h-20 rounded-lg bg-gray-100 mb-2" />
                      )}
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.nameAr}</p>
                      <p className="text-[10px] text-gray-400 truncate">{p.name}</p>
                      <p className="text-xs font-bold text-[#5B7B6D] mt-1">{effectivePriceOf(p).toFixed(2)} ر.س</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-invoice-product')) { e.preventDefault(); setDragOverList(true); } }}
          onDragLeave={() => setDragOverList(false)}
          onDrop={handleListDrop}
          className={dragOverList ? 'ring-2 ring-[#5B7B6D] rounded-xl' : ''}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">المنتجات</h3>
            <button onClick={addItem} className="flex items-center gap-1 text-sm text-[#5B7B6D] hover:underline"><FiPlus size={14} /> إضافة منتج</button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-invoice-product')) { e.preventDefault(); e.stopPropagation(); setDragOverRow(i); } }}
                onDragLeave={() => setDragOverRow((prev) => (prev === i ? null : prev))}
                onDrop={(e) => handleRowDrop(e, i)}
                className={`grid grid-cols-12 gap-2 items-end rounded-lg transition ${dragOverRow === i ? 'ring-2 ring-[#5B7B6D] bg-[#5B7B6D]/5 p-1' : ''}`}
              >
                <div className="col-span-3">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">المنتج (عربي)</label>}
                  <input type="text" value={item.nameAr} onChange={(e) => updateItem(i, 'nameAr', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#5B7B6D] outline-none" />
                </div>
                <div className="col-span-3">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">المنتج (إنجليزي)</label>}
                  <input type="text" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#5B7B6D] outline-none" dir="ltr" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">الكمية</label>}
                  <input type="number" min="1" value={item.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => { const v = parseInt(e.target.value); updateItem(i, 'quantity', isNaN(v) ? 1 : Math.max(1, v)); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#5B7B6D] outline-none" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs text-gray-500 mb-1">السعر</label>}
                  <input type="number" min="0" step="0.01" value={item.unitPrice === 0 ? '' : item.unitPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => { const v = parseFloat(e.target.value); updateItem(i, 'unitPrice', isNaN(v) ? 0 : v); }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#5B7B6D] outline-none" />
                </div>
                <div className="col-span-1 text-center font-bold text-sm py-2">{item.total.toFixed(2)}</div>
                <div className="col-span-1 flex items-end gap-1">
                  <button onClick={() => openPicker(i)} title="اختر من المنتجات" className="p-2 text-[#5B7B6D] hover:bg-[#5B7B6D]/10 rounded-lg">
                    <FiSearch size={14} />
                  </button>
                  <button onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" disabled={items.length === 1}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm" />
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الخصم</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm"
                  title="نوع الخصم"
                >
                  <option value="fixed">مبلغ ثابت (ر.س)</option>
                  <option value="percentage">نسبة مئوية (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قيمة الخصم</label>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setDiscount(isNaN(value) ? 0 : Math.max(0, value));
                  }}
                  placeholder={discountType === 'percentage' ? '0 - 100' : '0.00'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5B7B6D] outline-none text-sm"
                />
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>المجموع الفرعي</span><span className="flex items-center gap-1">{subtotal.toFixed(2)} <SarIcon size={13} /></span></div>
              {discountAmount > 0 && <div className="flex justify-between text-red-600"><span>الخصم</span><span className="flex items-center gap-1">-{discountAmount.toFixed(2)} <SarIcon size={13} /></span></div>}
              {settings?.vatEnabled && <div className="flex justify-between"><span>ضريبة ({settings.vatPercentage}%)</span><span className="flex items-center gap-1">{vatAmount.toFixed(2)} <SarIcon size={13} /></span></div>}
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>الإجمالي</span><span className="flex items-center gap-1">{total.toFixed(2)} <SarIcon size={16} /></span></div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
          <button onClick={() => handleSave()} disabled={saving}
            className="px-6 py-2 bg-[#5B7B6D] text-white rounded-xl text-sm font-medium hover:bg-[#4a6a5c] transition-colors disabled:opacity-50">
            {saving ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
          </button>
          <button onClick={() => handleSave({ print: true })} disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
            <FiPrinter size={14} /> حفظ وطباعة
          </button>
          <button onClick={() => handleSave({ whatsapp: true })} disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
            <FaWhatsapp size={14} /> حفظ وإرسال عبر واتساب
          </button>
        </div>
      </div>
    </div>
  );
}
