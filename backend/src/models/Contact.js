
// // import mongoose from 'mongoose';

// // const contactSchema = new mongoose.Schema(
// //   {
// //     user: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'User',
// //       required: true,
// //       index: true,
// //     },

// //     name: {
// //       type: String,
// //       default: '',
// //       trim: true,
// //     },

// //     phone: {
// //       type: String,
// //       required: true,
// //       trim: true,
// //     },

// //     optedIn: {
// //       type: Boolean,
// //       default: false,
// //     },

// //     lastInboundAt: {
// //       type: Date,
// //       default: null,
// //     },
// //   },
// //   {
// //     timestamps: true,
// //   }
// // );

// // // One contact per phone number per user.
// // contactSchema.index(
// //   { user: 1, phone: 1 },
// //   { unique: true }
// // );

// // const Contact =
// //   mongoose.models.Contact ||
// //   mongoose.model('Contact', contactSchema);

// // export default Contact;



// import mongoose from 'mongoose';

// const contactSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//       index: true,
//     },
//     name: {
//       type: String,
//       default: '',
//       trim: true,
//     },
//     phone: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     optedIn: {
//       type: Boolean,
//       default: false,
//     },
//     optedInAt: {
//       type: Date,
//       default: null,
//     },
//     consentSource: {
//       type: String,
//       default: '',
//       trim: true,
//     },
//     lastInboundAt: Date,
//   },
//   { timestamps: true }
// );

// contactSchema.index({ user: 1, phone: 1 }, { unique: true });

// const Contact =
//   mongoose.models.Contact ||
//   mongoose.model('Contact', contactSchema);

// export default Contact;



import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      default: '',
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    optedIn: {
      type: Boolean,
      default: false,
    },

    optedInAt: {
      type: Date,
      default: null,
    },

    consentSource: {
      type: String,
      default: '',
      trim: true,
    },

    lastInboundAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One phone number per user.
contactSchema.index(
  { user: 1, phone: 1 },
  { unique: true }
);

const Contact =
  mongoose.models.Contact ||
  mongoose.model('Contact', contactSchema);

export default Contact;
