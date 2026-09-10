const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { isAuthenticated, isCustomer } = require('../middleware/auth');

// All payment routes require Customer authentication
router.use('/customer/payments', isAuthenticated, isCustomer);

// Payment History
router.get('/customer/payments', paymentController.showPaymentHistory);

// Payment Success Confirmation Page
router.get('/customer/payments/success/:paymentId', paymentController.showPaymentSuccess);

// Payment Receipt / Details Page
router.get('/customer/payments/details/:paymentId', paymentController.showPaymentDetails);

// Payment Checkout Form (by ride ID)
router.get('/customer/payments/:rideId', paymentController.showPaymentPage);

// Process Payment Submission
router.post('/customer/payments/:rideId/process', paymentController.processPayment);

module.exports = router;
