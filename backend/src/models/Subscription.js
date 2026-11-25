
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // USER ACCOUNT
    // One current subscription per CRM user.
    // --------------------------------------------------
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // --------------------------------------------------
    // PLAN
    // --------------------------------------------------
    planCode: {
      type: String,
      required: true,
      default: 'free_trial',
      trim: true,
      lowercase: true,
    },

    planName: {
      type: String,
      required: true,
      default: 'Free Trial',
      trim: true,
    },

    billingCycle: {
      type: String,
      enum: ['trial', 'monthly', 'yearly'],
      default: 'trial',
      required: true,
    },

    subscriptionDurationMonths: {
      type: Number,
      min: 0,
      default: 0,
    },

    // --------------------------------------------------
    // SUBSCRIPTION STATUS
    // --------------------------------------------------
    status: {
      type: String,
      enum: [
        'trial',
        'active',
        'past_due',
        'cancelled',
        'expired',
      ],
      default: 'trial',
      required: true,
      index: true,
    },

    // --------------------------------------------------
    // MESSAGE QUOTA
    // --------------------------------------------------
    messageLimit: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },

    messagesUsed: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Messages used must be a whole number.',
      },
    },

    messagesReserved: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Reserved messages must be a whole number.',
      },
    },

    // --------------------------------------------------
    // TRIAL INFORMATION
    // --------------------------------------------------
    trialGrantedAt: {
      type: Date,
      default: null,
    },

    trialUsed: {
      type: Boolean,
      default: false,
    },

    // --------------------------------------------------
    // SUBSCRIPTION PERIOD
    // --------------------------------------------------
    subscriptionStartedAt: {
      type: Date,
      default: null,
    },

    subscriptionEndsAt: {
      type: Date,
      default: null,
    },

    // Current monthly quota period.
    currentPeriodStart: {
      type: Date,
      default: null,
    },

    currentPeriodEnd: {
      type: Date,
      default: null,
    },

    // Next scheduled quota reset.
    nextQuotaResetAt: {
      type: Date,
      default: null,
    },

    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    // --------------------------------------------------
    // RAZORPAY INFORMATION
    // --------------------------------------------------
    paymentProvider: {
      type: String,
      enum: ['none', 'razorpay'],
      default: 'none',
    },

    razorpayCustomerId: {
      type: String,
      default: null,
      trim: true,
    },

    razorpaySubscriptionId: {
      type: String,
      default: null,
      trim: true,
    },

    razorpayPlanId: {
      type: String,
      default: null,
      trim: true,
    },

    razorpayStatus: {
      type: String,
      default: null,
      trim: true,
    },

    lastPaymentId: {
      type: String,
      default: null,
      trim: true,
    },

    lastPaymentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------
subscriptionSchema.pre('validate', function (next) {
  if (this.messagesUsed + this.messagesReserved > this.messageLimit) {
    return next(
      new Error('Used and reserved messages cannot exceed the message limit.')
    );
  }

  next();
});

// --------------------------------------------------
// MESSAGE BALANCE
// --------------------------------------------------
subscriptionSchema.virtual('messagesRemaining').get(function () {
  return Math.max(
    0,
    this.messageLimit - this.messagesUsed - this.messagesReserved
  );
});

subscriptionSchema.virtual('usagePercentage').get(function () {
  if (!this.messageLimit) return 0;

  return Math.min(
    100,
    Math.round((this.messagesUsed / this.messageLimit) * 100)
  );
});

// --------------------------------------------------
// ACCESS CHECK
// --------------------------------------------------
subscriptionSchema.virtual('canSendMessages').get(function () {
  const now = new Date();

  const trialAccess =
    this.status === 'trial';

  const activeAccess =
    this.status === 'active' &&
    (
      !this.subscriptionEndsAt ||
      this.subscriptionEndsAt > now
    );

  const cancelledAccess =
    this.status === 'cancelled' &&
    this.cancelAtPeriodEnd === true &&
    this.subscriptionEndsAt &&
    this.subscriptionEndsAt > now;

  return (
    (trialAccess || activeAccess || cancelledAccess) &&
    this.messagesRemaining > 0
  );
});

// --------------------------------------------------
// INDEXES
// --------------------------------------------------
subscriptionSchema.index({
  status: 1,
  currentPeriodEnd: 1,
});

subscriptionSchema.index({
  status: 1,
  nextQuotaResetAt: 1,
});

subscriptionSchema.index(
  { razorpaySubscriptionId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// --------------------------------------------------
// MODEL
// --------------------------------------------------
const Subscription =
  mongoose.models.Subscription ||
  mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
