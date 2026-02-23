import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'أريج الأخوان' },
  storeNameEn: { type: String, default: 'Areej Al Aqhwan' },
  storeDescription: { type: String, default: 'متجر الزهور والهدايا الفاخرة' },
  storeDescriptionEn: { type: String, default: 'Premium Flower and Gift Shop' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  vatEnabled: { type: Boolean, default: true },
  vatPercentage: { type: Number, default: 15 },
  currency: { type: String, default: 'SAR' },
  logo: { type: String, default: '' },
  banner: { type: String, default: '' },
  instagram: { type: String, default: '' },
  instagramEnabled: { type: Boolean, default: false },
  facebook: { type: String, default: '' },
  facebookEnabled: { type: Boolean, default: false },
  twitter: { type: String, default: '' },
  twitterEnabled: { type: Boolean, default: false },
  pinterest: { type: String, default: '' },
  pinterestEnabled: { type: Boolean, default: false },
  tiktok: { type: String, default: '' },
  tiktokEnabled: { type: Boolean, default: false },
  snapchat: { type: String, default: '' },
  snapchatEnabled: { type: Boolean, default: false },
  defaultLanguage: { type: String, enum: ['ar', 'en'], default: 'ar' },
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
