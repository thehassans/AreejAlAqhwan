import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  workerName: { type: String, required: true },
  date: { type: String, required: true },
  checkInTime: { type: String, required: true },
  method: { type: String, enum: ['qr', 'manual'], default: 'qr' },
}, { timestamps: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
