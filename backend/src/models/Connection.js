import mongoose from 'mongoose';
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  wabaId: String, phoneNumberId: String, displayPhone: String, verifiedName: String, quality: String,
  token: String, pin: String,
  status: { type: String, enum: ['connected', 'needs_reauth'], default: 'connected' },
}, { timestamps: true });
export default mongoose.model('Connection', s);
