const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      unique: true,
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number between 1 and 5'
      }
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring a customer can only rate a specific ride once
reviewSchema.index({ customer: 1, ride: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
