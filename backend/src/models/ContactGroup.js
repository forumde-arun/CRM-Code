
import mongoose from 'mongoose';

const contactGroupSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    contactIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
      },
    ],
  },
  {
    timestamps: true,
  }
);

contactGroupSchema.index(
  { user: 1, name: 1 },
  { unique: true }
);

contactGroupSchema.index({ user: 1, updatedAt: -1 });

const ContactGroup =
  mongoose.models.ContactGroup ||
  mongoose.model('ContactGroup', contactGroupSchema);

export default ContactGroup;
