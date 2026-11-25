
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
    },

    contactName: {
      type: String,
      default: '',
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    waId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['queued', 'sent', 'failed'],
      default: 'queued',
    },

    error: {
      type: String,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const campaignSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      required: true,
    },

    templateName: {
      type: String,
      required: true,
      trim: true,
    },

    language: {
      type: String,
      required: true,
      trim: true,
    },

    variables: {
      type: [String],
      default: [],
    },

    audienceType: {
      type: String,
      enum: ['all', 'group', 'selected'],
      default: 'all',
    },

    selectedGroupIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContactGroup',
      },
    ],

    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ user: 1, createdAt: -1 });

const Campaign =
  mongoose.models.Campaign ||
  mongoose.model('Campaign', campaignSchema);

export default Campaign;
