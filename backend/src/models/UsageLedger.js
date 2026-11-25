
import mongoose from 'mongoose';

const usageLedgerSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // ACCOUNT OWNERSHIP
    // --------------------------------------------------
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },

    // --------------------------------------------------
    // TRANSACTION TYPE
    // --------------------------------------------------
    type: {
      type: String,
      enum: [
        'trial_grant',
        'period_grant',
        'reservation',
        'consumption',
        'release',
        'adjustment',
      ],
      required: true,
    },

    // Always a positive integer.
    // The transaction type determines its meaning.
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Usage quantity must be a whole number.',
      },
    },

    // --------------------------------------------------
    // BALANCE SNAPSHOTS
    // Optional snapshots for audit and troubleshooting.
    // --------------------------------------------------
    balanceBefore: {
      type: Number,
      min: 0,
      default: null,
    },

    balanceAfter: {
      type: Number,
      min: 0,
      default: null,
    },

    // --------------------------------------------------
    // CAMPAIGN / MESSAGE REFERENCE
    // --------------------------------------------------
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
      index: true,
    },

    messageId: {
      type: String,
      default: null,
      trim: true,
    },

    // --------------------------------------------------
    // IDEMPOTENCY
    // Prevents duplicate processing of the same operation.
    // Example: campaign_123_reservation
    // --------------------------------------------------
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // --------------------------------------------------
    // DESCRIPTION / ADMINISTRATIVE INFORMATION
    // --------------------------------------------------
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // --------------------------------------------------
    // PERIOD TRACKING
    // --------------------------------------------------
    periodStart: {
      type: Date,
      default: null,
    },

    periodEnd: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --------------------------------------------------
// QUERY INDEXES
// --------------------------------------------------
usageLedgerSchema.index({
  user: 1,
  createdAt: -1,
});

usageLedgerSchema.index({
  subscription: 1,
  createdAt: -1,
});

usageLedgerSchema.index({
  campaign: 1,
  type: 1,
});

// --------------------------------------------------
// MODEL
// --------------------------------------------------
const UsageLedger =
  mongoose.models.UsageLedger ||
  mongoose.model('UsageLedger', usageLedgerSchema);

export default UsageLedger;
