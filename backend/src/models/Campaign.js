import mongoose from 'mongoose';
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String, templateName: String, language: String, variables: [String],
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  messages: [{ contactName: String, phone: String, waId: String, status: { type: String, default: 'queued' }, error: String }],
}, { timestamps: true });
export default mongoose.model('Campaign', s);
