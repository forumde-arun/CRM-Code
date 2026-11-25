
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
      index: true,
    },

    provider: {
      type: String,
      enum: ['razorpay'],
      default: 'razorpay',
      required: true,
    },

    razorpayOrderId: {
      type: String,
      default: null,
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },

    razorpaySubscriptionId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    planCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    planName: {
      type: String,
      required: true,
      trim: true,
    },

    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },

    amount: {
      // Store the amount in the smallest currency unit.
      // For INR, this means paise.
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        'created',
        'authorized',
        'captured',
        'failed',
        'refunded',
      ],
      default: 'created',
      required: true,
      index: true,
    },

    failureReason: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate Razorpay payment records.
paymentSchema.index(
  { provider: 1, razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayPaymentId: { $type: 'string' },
    },
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });

const Payment =
  mongoose.models.Payment ||
  mongoose.model('Payment', paymentSchema);

export default Payment;
