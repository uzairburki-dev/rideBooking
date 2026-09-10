const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required']
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required']
  }
}, { _id: false });

const rideSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
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
    pickup: {
      type: locationSchema,
      required: true
    },
    destination: {
      type: locationSchema,
      required: true
    },
    distance: {
      type: Number,
      required: [true, 'Ride distance is required'],
      min: [0.1, 'Distance must be at least 0.1 km']
    },
    fare: {
      type: Number,
      required: [true, 'Ride fare is required'],
      min: [0, 'Fare cannot be negative']
    },
    rideType: {
      type: String,
      enum: ['Economy', 'Comfort', 'Premium', 'SUV'],
      required: [true, 'Ride type is required']
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'driver_arriving', 'driver_arrived', 'started', 'completed', 'cancelled'],
      default: 'requested',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    cancelReason: {
      type: String,
      default: null
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
rideSchema.index({ customer: 1, createdAt: -1 });
rideSchema.index({ driver: 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);
