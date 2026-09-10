const Ride = require('../models/Ride');
const Review = require('../models/Review');
const { calculateHaversineDistance, getDemoCoordinates } = require('../utils/distanceCalculator');
const { calculateFare, getAllFareEstimates, RIDE_PRICING } = require('../utils/fareCalculator');

/**
 * Render Book a Ride Page
 */
exports.showBookingForm = (req, res) => {
  res.render('customer/rides/new', {
    title: 'Book a Ride',
    page: 'book-ride',
    pricing: RIDE_PRICING
  });
};

/**
 * Calculate Fare Estimate (JSON API)
 * Strictly calculates real distance server-side from location coordinates
 */
exports.calculateFareEstimate = (req, res) => {
  try {
    const { pickupAddress, destinationAddress, pickupLat, pickupLng, destLat, destLng } = req.body;

    if (!pickupAddress || !destinationAddress || !pickupAddress.trim() || !destinationAddress.trim()) {
      return res.status(400).json({ error: 'Please select valid pickup and destination locations.' });
    }

    if (pickupAddress.trim().toLowerCase() === destinationAddress.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Pickup and destination locations must be different.' });
    }

    // Resolve geographic coordinates
    const pCoords = (pickupLat && pickupLng && !isNaN(parseFloat(pickupLat)) && !isNaN(parseFloat(pickupLng))) 
      ? { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) } 
      : getDemoCoordinates(pickupAddress);

    const dCoords = (destLat && destLng && !isNaN(parseFloat(destLat)) && !isNaN(parseFloat(destLng))) 
      ? { lat: parseFloat(destLat), lng: parseFloat(destLng) } 
      : getDemoCoordinates(destinationAddress, 33.5651, 73.0169);

    // Compute real Haversine distance
    const distance = calculateHaversineDistance(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);

    if (distance < 0.05) {
      return res.status(400).json({ error: 'Pickup and destination locations must be different.' });
    }

    const estimates = getAllFareEstimates(distance);

    return res.json({
      success: true,
      pickup: { address: pickupAddress.trim(), ...pCoords },
      destination: { address: destinationAddress.trim(), ...dCoords },
      distance,
      estimates
    });

  } catch (error) {
    console.error('[Fare Estimate Error]:', error);
    return res.status(500).json({ error: 'Failed to calculate fare estimate.' });
  }
};

/**
 * Handle Create Ride Booking
 * Server calculates final distance & fare to prevent client-side manipulation
 */
exports.createRide = async (req, res, next) => {
  try {
    const { pickupAddress, destinationAddress, rideType, pickupLat, pickupLng, destLat, destLng } = req.body;

    // Server-side Validation
    if (!pickupAddress || !destinationAddress || !rideType || !pickupAddress.trim() || !destinationAddress.trim()) {
      req.flash('error', 'Please select valid pickup and destination locations.');
      return res.redirect('/customer/rides/new');
    }

    if (pickupAddress.trim().toLowerCase() === destinationAddress.trim().toLowerCase()) {
      req.flash('error', 'Pickup and destination locations must be different.');
      return res.redirect('/customer/rides/new');
    }

    if (!['Economy', 'Comfort', 'Premium', 'SUV'].includes(rideType)) {
      req.flash('error', 'Invalid ride type selected.');
      return res.redirect('/customer/rides/new');
    }

    // Resolve geographic coordinates
    const pCoords = (pickupLat && pickupLng && !isNaN(parseFloat(pickupLat)) && !isNaN(parseFloat(pickupLng))) 
      ? { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) } 
      : getDemoCoordinates(pickupAddress);

    const dCoords = (destLat && destLng && !isNaN(parseFloat(destLat)) && !isNaN(parseFloat(destLng))) 
      ? { lat: parseFloat(destLat), lng: parseFloat(destLng) } 
      : getDemoCoordinates(destinationAddress, 33.5651, 73.0169);

    // Server-side real distance calculation (Haversine formula)
    const distance = calculateHaversineDistance(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);

    if (distance < 0.05) {
      req.flash('error', 'Pickup and destination locations must be different.');
      return res.redirect('/customer/rides/new');
    }

    // Calculate final fare based on real distance
    const fare = calculateFare(rideType, distance);

    // Generate unique booking ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingId = `RG-${dateStr}-${randStr}`;

    // Create Ride document
    const newRide = new Ride({
      bookingId,
      customer: req.session.user._id,
      driver: null,
      pickup: {
        address: pickupAddress.trim(),
        latitude: pCoords.lat,
        longitude: pCoords.lng
      },
      destination: {
        address: destinationAddress.trim(),
        latitude: dCoords.lat,
        longitude: dCoords.lng
      },
      distance,
      fare,
      rideType,
      status: 'requested',
      paymentStatus: 'pending',
      requestedAt: new Date()
    });

    await newRide.save();

    req.flash('success', `Ride ${bookingId} booked successfully! Searching for available drivers...`);
    return res.redirect(`/customer/rides/${newRide._id}`);

  } catch (error) {
    console.error('[Create Ride Error]:', error);
    req.flash('error', 'Failed to create ride booking. Please try again.');
    return res.redirect('/customer/rides/new');
  }
};

/**
 * Show Booking History Page
 */
exports.showBookingHistory = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { customer: req.session.user._id };

    if (status && status !== 'all') {
      if (status === 'active') {
        query.status = { $in: ['requested', 'accepted', 'driver_arriving', 'driver_arrived', 'started'] };
      } else {
        query.status = status;
      }
    }

    const rides = await Ride.find(query)
      .populate({
        path: 'driver',
        populate: [
          { path: 'user', select: 'fullName phone' },
          { path: 'vehicle' }
        ]
      })
      .sort({ createdAt: -1 });

    res.render('customer/rides/index', {
      title: 'My Rides History',
      page: 'my-rides',
      rides,
      currentFilter: status || 'all'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Show Ride Details Page
 */
exports.showRideDetails = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate({
        path: 'driver',
        populate: [
          { path: 'user', select: 'fullName phone' },
          { path: 'vehicle' }
        ]
      });

    if (!ride) {
      req.flash('error', 'Ride not found.');
      return res.redirect('/customer/rides');
    }

    // Ownership Authorization Check
    if (ride.customer.toString() !== req.session.user._id.toString()) {
      req.flash('error', 'Unauthorized access to ride details.');
      return res.redirect('/customer/rides');
    }

    let review = null;
    if (ride.status === 'completed') {
      review = await Review.findOne({ ride: ride._id });
    }

    res.render('customer/rides/show', {
      title: `Ride Details — ${ride.bookingId}`,
      page: 'ride-details',
      ride,
      review
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      req.flash('error', 'Invalid ride ID.');
      return res.redirect('/customer/rides');
    }
    next(error);
  }
};

/**
 * Handle Ride Cancellation
 */
exports.cancelRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      req.flash('error', 'Ride not found.');
      return res.redirect('/customer/rides');
    }

    // Ownership Check
    if (ride.customer.toString() !== req.session.user._id.toString()) {
      req.flash('error', 'Unauthorized attempt to cancel ride.');
      return res.redirect('/customer/rides');
    }

    // Check Eligibility
    const eligibleStatuses = ['requested', 'accepted', 'driver_arriving'];
    if (!eligibleStatuses.includes(ride.status)) {
      req.flash('error', `This ride cannot be cancelled in its current status (${ride.status}).`);
      return res.redirect(`/customer/rides/${ride._id}`);
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancelReason = req.body.cancelReason || 'Cancelled by customer';

    await ride.save();

    req.flash('info', `Ride ${ride.bookingId} has been cancelled successfully.`);
    return res.redirect(`/customer/rides/${ride._id}`);

  } catch (error) {
    console.error('[Cancel Ride Error]:', error);
    req.flash('error', 'Failed to cancel ride.');
    return res.redirect('/customer/rides');
  }
};
