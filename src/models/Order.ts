import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  nameAr: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, default: '' },
});

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  vat: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    city: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  paymentMethod: { type: String, default: 'cod' },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
