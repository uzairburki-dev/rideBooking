const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const { isAuthenticated, isCustomer } = require('../middleware/auth');

// All ride routes require Customer authentication
router.use(isAuthenticated, isCustomer);

// Booking history
router.get('/', rideController.showBookingHistory);

// New Ride Form
router.get('/new', rideController.showBookingForm);

// Fare Estimation API
router.post('/estimate', rideController.calculateFareEstimate);

// Create Ride
router.post('/', rideController.createRide);

// Ride Details
router.get('/:id', rideController.showRideDetails);

// Cancel Ride
router.post('/:id/cancel', rideController.cancelRide);

module.exports = router;
