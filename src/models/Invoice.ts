import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  nameAr: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  vat: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
