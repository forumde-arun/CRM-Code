import mongoose from 'mongoose';
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: '' },
  phone: { type: String, required: true },
  optedIn: { type: Boolean, default: true },
  lastInboundAt: Date,
}, { timestamps: true });
s.index({ user: 1, phone: 1 }, { unique: true });
export default mongoose.model('Contact', s);
