
import mongoose from 'mongoose';

const paymentEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['razorpay'],
      default: 'razorpay',
      required: true,
    },

    // Unique identifier for the incoming webhook event.
    // Prefer Razorpay's x-razorpay-event-id header when available.
    eventId: {
      type: String,
      required: true,
      trim: true,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        'received',
        'processing',
        'processed',
        'failed',
        'ignored',
      ],
      default: 'received',
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
      index: true,
    },

    razorpaySubscriptionId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    attempts: {
      type: Number,
      min: 0,
      default: 0,
    },

    receivedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    lastError: {
      type: String,
      default: null,
      maxlength: 2000,
    },

    // Store only the event information needed for processing
    // and reconciliation. Avoid storing unnecessary payment data.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate processing of the same provider event.
paymentEventSchema.index(
  { provider: 1, eventId: 1 },
  { unique: true }
);

paymentEventSchema.index({
  status: 1,
  receivedAt: 1,
});

const PaymentEvent =
  mongoose.models.PaymentEvent ||
  mongoose.model('PaymentEvent', paymentEventSchema);

export default PaymentEvent;
