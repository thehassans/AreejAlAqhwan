import mongoose from 'mongoose';

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pageAccess: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);
