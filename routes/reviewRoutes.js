const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { isAuthenticated, isCustomer, isDriver, isApprovedDriver } = require('../middleware/auth');

// Customer Rating Routes
router.get('/customer/rides/:id/rating', isAuthenticated, isCustomer, reviewController.showRatingForm);
router.post('/customer/rides/:id/rating', isAuthenticated, isCustomer, reviewController.createReview);

// Driver Ratings Dashboard
router.get('/driver/ratings', isAuthenticated, isDriver, isApprovedDriver, reviewController.showDriverRatings);

module.exports = router;
