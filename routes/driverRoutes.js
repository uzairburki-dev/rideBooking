const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { isAuthenticated, isDriver, isApprovedDriver, isOnlineDriver, checkDriverApproval } = require('../middleware/auth');

// Base middleware for all driver routes
router.use('/driver', isAuthenticated, isDriver);

// Dashboard & Profile
router.get('/driver/dashboard', checkDriverApproval, driverController.showDashboard);
router.get('/driver/profile', checkDriverApproval, driverController.showProfile);

// Status Toggle
router.post('/driver/status', isApprovedDriver, driverController.updateStatus);

// Available Ride Requests
router.get('/driver/rides/requests', isApprovedDriver, isOnlineDriver, driverController.showRideRequests);
router.get('/driver/rides/:id/request', isApprovedDriver, driverController.showRideRequest);

// Accept & Reject Requests
router.post('/driver/rides/:id/accept', isApprovedDriver, isOnlineDriver, driverController.acceptRide);
router.post('/driver/rides/:id/reject', isApprovedDriver, driverController.rejectRide);

// Active Ride Management
router.get('/driver/rides/current', isApprovedDriver, driverController.showCurrentRide);
router.post('/driver/rides/:id/status', isApprovedDriver, driverController.updateRideStatus);

// History & Earnings
router.get('/driver/rides/history', isApprovedDriver, driverController.showRideHistory);
router.get('/driver/earnings', isApprovedDriver, driverController.showEarnings);

module.exports = router;
