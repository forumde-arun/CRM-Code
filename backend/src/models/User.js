
import mongoose from 'mongoose';

const s = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // Google-only accounts can have no password.
  password: {
    type: String,
    default: undefined,
    select: false,
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },

  avatar: {
    type: String,
    default: '',
  },

  emailVerified: {
    type: Boolean,
    default: false,
  },

  passwordChangedAt: {
    type: Date,
    default: null,
  },

  // Store only the SHA-256 hash of the reset token.
  passwordResetToken: {
    type: String,
    default: undefined,
    select: false,
  },
  firebaseUid: {
  type: String,
  unique: true,
  sparse: true,
},

  passwordResetExpires: {
    type: Date,
    default: undefined,
    select: false,
  },

}, { timestamps: true });

export default mongoose.model('User', s);
