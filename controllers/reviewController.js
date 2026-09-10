const Review = require('../models/Review');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

/**
 * Show Customer Rating Form
 */
exports.showRatingForm = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate({
        path: 'driver',
        populate: [
          { path: 'user', select: 'fullName' },
          { path: 'vehicle' }
        ]
      });

    if (!ride) {
      req.flash('error', 'Ride not found.');
      return res.redirect('/customer/rides');
    }

    // Customer Ownership Check
    if (ride.customer.toString() !== req.session.user._id.toString()) {
      req.flash('error', 'Unauthorized access to ride rating.');
      return res.redirect('/customer/rides');
    }

    // Eligibility Check
    if (ride.status !== 'completed' || !ride.driver) {
      req.flash('error', 'You can only rate a completed ride with an assigned driver.');
      return res.redirect(`/customer/rides/${ride._id}`);
    }

    // Check existing review
    const existingReview = await Review.findOne({ ride: ride._id });
    if (existingReview) {
      req.flash('info', 'You have already rated this ride.');
      return res.redirect(`/customer/rides/${ride._id}`);
    }

    res.render('customer/rides/rating', {
      title: `Rate Driver — ${ride.bookingId}`,
      page: 'rate-ride',
      ride
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Handle Submit Customer Review
 */
exports.createReview = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      req.flash('error', 'Ride not found.');
      return res.redirect('/customer/rides');
    }

    // Customer Ownership Check
    if (ride.customer.toString() !== req.session.user._id.toString()) {
      req.flash('error', 'Unauthorized attempt to rate ride.');
      return res.redirect('/customer/rides');
    }

    // Eligibility Check
    if (ride.status !== 'completed' || !ride.driver) {
      req.flash('error', 'You can only rate a completed ride.');
      return res.redirect(`/customer/rides/${ride._id}`);
    }

    // Prevent Duplicate Rating
    const existingReview = await Review.findOne({ ride: ride._id });
    if (existingReview) {
      req.flash('error', 'You have already rated this ride.');
      return res.redirect(`/customer/rides/${ride._id}`);
    }

    // Validate Rating (integer 1-5)
    const ratingInt = parseInt(req.body.rating, 10);
    if (isNaN(ratingInt) || ![1, 2, 3, 4, 5].includes(ratingInt)) {
      req.flash('error', 'Please select a valid rating from 1 to 5 stars.');
      return res.redirect(`/customer/rides/${ride._id}/rating`);
    }

    // Sanitize comment (max 500 chars)
    const comment = req.body.comment ? req.body.comment.trim().slice(0, 500) : '';

    // Create Review
    const driverId = ride.driver._id || ride.driver;
    const newReview = new Review({
      customer: req.session.user._id,
      driver: driverId,
      ride: ride._id,
      rating: ratingInt,
      comment
    });

    await newReview.save();

    // Recalculate Driver Average Rating & Total Ratings
    const allDriverReviews = await Review.find({ driver: driverId });
    const totalRatings = allDriverReviews.length;
    const sumRatings = allDriverReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRatings > 0 ? Math.round((sumRatings / totalRatings) * 10) / 10 : 0;

    await Driver.findByIdAndUpdate(driverId, {
      rating: avgRating,
      totalRatings
    });

    req.flash('success', 'Your rating has been submitted successfully. Thank you for your feedback!');
    return res.redirect(`/customer/rides/${ride._id}`);

  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'You have already rated this ride.');
      return res.redirect(`/customer/rides/${req.params.id}`);
    }
    console.error('[Create Review Error]:', error);
    req.flash('error', 'Failed to submit rating. Please try again.');
    return res.redirect(`/customer/rides/${req.params.id}/rating`);
  }
};

/**
 * Show Driver Ratings & Breakdown Dashboard
 */
exports.showDriverRatings = async (req, res, next) => {
  try {
    const driver = req.driverInfo || await Driver.findOne({ user: req.session.user._id }).populate('vehicle');

    if (!driver) {
      req.flash('error', 'Driver profile not found.');
      return res.redirect('/login');
    }

    const reviews = await Review.find({ driver: driver._id })
      .populate('customer', 'fullName')
      .populate('ride', 'bookingId createdAt')
      .sort({ createdAt: -1 });

    // Calculate rating breakdown (counts & percentages)
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (counts[r.rating] !== undefined) {
        counts[r.rating]++;
      }
    });

    const total = reviews.length;
    const breakdown = {
      5: { count: counts[5], pct: total > 0 ? Math.round((counts[5] / total) * 100) : 0 },
      4: { count: counts[4], pct: total > 0 ? Math.round((counts[4] / total) * 100) : 0 },
      3: { count: counts[3], pct: total > 0 ? Math.round((counts[3] / total) * 100) : 0 },
      2: { count: counts[2], pct: total > 0 ? Math.round((counts[2] / total) * 100) : 0 },
      1: { count: counts[1], pct: total > 0 ? Math.round((counts[1] / total) * 100) : 0 }
    };

    res.render('driver/ratings/index', {
      title: 'Customer Ratings & Reviews',
      page: 'driver-ratings',
      driver,
      reviews,
      totalRatings: total,
      averageRating: driver.rating || (total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : 0),
      breakdown
    });

  } catch (error) {
    next(error);
  }
};
