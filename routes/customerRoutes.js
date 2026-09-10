const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { isAuthenticated, isCustomer } = require('../middleware/auth');

// Customer Dashboard Route
router.get('/customer/dashboard', isAuthenticated, isCustomer, customerController.showDashboard);

module.exports = router;
