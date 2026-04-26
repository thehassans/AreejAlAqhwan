import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  workerName: { type: String, required: true },
  date: { type: String, required: true },
  checkInTime: { type: String, required: true },
  checkOutTime: { type: String, default: null },
  workedMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['checked_in', 'checked_out'], default: 'checked_in' },
  method: { type: String, enum: ['qr'], default: 'qr' },
}, { timestamps: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
