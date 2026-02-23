import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  city: { type: String, default: '' },
  address: { type: String, default: '' },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  loyaltyTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze',
  },
  loyaltyPoints: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
