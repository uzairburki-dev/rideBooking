const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    licenseNumber: {
      type: String,
      required: [true, 'Driver license number is required'],
      unique: true,
      trim: true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    driverStatus: {
      type: String,
      enum: ['offline', 'online'],
      default: 'offline'
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    rejectionReason: {
      type: String,
      default: null
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5.0
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Driver', driverSchema);
