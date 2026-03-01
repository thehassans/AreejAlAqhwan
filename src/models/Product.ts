import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  description: { type: String, default: '' },
  descriptionAr: { type: String, default: '' },
  price: { type: Number, required: true },
  category: { type: String, default: 'عام' },
  images: [{ type: String }],
  inStock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  discountType: { type: String, default: 'percentage' },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
