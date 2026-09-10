const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// All Admin routes require Admin authentication & authorization
router.use('/admin', isAuthenticated, isAdmin);

// Admin Dashboard
router.get('/admin/dashboard', adminController.showDashboard);

// Customer Management
router.get('/admin/customers', adminController.showCustomers);
router.get('/admin/customers/:id', adminController.showCustomerDetails);
router.post('/admin/customers/:id/status', adminController.toggleCustomerStatus);

// Driver Management & Approvals
router.get('/admin/drivers', adminController.showDrivers);
router.get('/admin/drivers/pending', adminController.showPendingDrivers);
router.get('/admin/drivers/:id', adminController.showDriverDetails);
router.post('/admin/drivers/:id/approve', adminController.approveDriver);
router.post('/admin/drivers/:id/reject', adminController.rejectDriver);
router.post('/admin/drivers/:id/status', adminController.toggleDriverStatus);

// Ride Management
router.get('/admin/rides', adminController.showRides);
router.get('/admin/rides/:id', adminController.showRideDetails);

// Payment Management
router.get('/admin/payments', adminController.showPayments);
router.get('/admin/payments/:id', adminController.showPaymentDetails);

// Review Management
router.get('/admin/reviews', adminController.showReviews);
router.post('/admin/reviews/:id/delete', adminController.deleteReview);

// Reports & Analytics
router.get('/admin/reports', adminController.showReports);

// Admin Profile
router.get('/admin/profile', adminController.showProfile);

module.exports = router;
