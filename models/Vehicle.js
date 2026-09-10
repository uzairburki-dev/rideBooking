const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true
    },
    vehicleType: {
      type: String,
      enum: ['Economy', 'Comfort', 'Premium', 'SUV'],
      required: [true, 'Vehicle type is required']
    },
    brand: {
      type: String,
      required: [true, 'Vehicle brand is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Vehicle year is required'],
      min: [1990, 'Vehicle year must be 1990 or newer']
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration / license plate number is required'],
      unique: true,
      trim: true
    },
    color: {
      type: String,
      required: [true, 'Vehicle color is required'],
      trim: true
    },
    seats: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: [1, 'Must have at least 1 seat']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
