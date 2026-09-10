const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'PKR',
      trim: true
    },
    method: {
      type: String,
      enum: ['Demo Card', 'Cash'],
      default: 'Demo Card',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    paidAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Performance & Lookup Indexes
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ ride: 1, status: 1 });
paymentSchema.index({ driver: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
