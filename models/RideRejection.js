const mongoose = require('mongoose');

const rideRejectionSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Composite index to quickly check if a driver rejected a ride
rideRejectionSchema.index({ driver: 1, ride: 1 }, { unique: true });

module.exports = mongoose.model('RideRejection', rideRejectionSchema);
