const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const Vehicle = require('../models/Vehicle');
const RideRejection = require('../models/RideRejection');

/**
 * Driver Dashboard Controller
 */
exports.showDashboard = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const driver = await Driver.findOne({ user: userId }).populate('vehicle');

    if (!driver) {
      req.flash('error', 'Driver profile not found.');
      return res.redirect('/login');
    }

    // Active ride for this driver
    const activeRide = await Ride.findOne({
      driver: driver._id,
      status: { $in: ['accepted', 'driver_arriving', 'driver_arrived', 'started'] }
    }).populate('customer', 'fullName phone');

    // Earnings metrics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const completedRides = await Ride.find({ driver: driver._id, status: 'completed' });
    const todayCompletedRides = completedRides.filter(r => new Date(r.completedAt || r.updatedAt) >= startOfToday);

    const totalEarnings = completedRides.reduce((sum, r) => sum + r.fare, 0);
    const todayEarnings = todayCompletedRides.reduce((sum, r) => sum + r.fare, 0);

    // Recent trip history
    const recentRides = await Ride.find({ driver: driver._id })
      .populate('customer', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Available Ride Requests (If approved & online)
    let availableRequests = [];
    if (driver.isApproved && driver.driverStatus === 'online' && !activeRide) {
      const rejections = await RideRejection.find({ driver: driver._id }).select('ride');
      const rejectedRideIds = rejections.map(r => r.ride);

      availableRequests = await Ride.find({
        status: 'requested',
        driver: null,
        _id: { $nin: rejectedRideIds }
      })
      .populate('customer', 'fullName phone')
      .sort({ createdAt: -1 })
      .limit(5);
    }

    res.render('driver/dashboard', {
      title: 'Driver Dashboard',
      page: 'driver-dashboard',
      user: req.session.user,
      driver,
      vehicle: driver.vehicle,
      activeRide,
      stats: {
        todayRidesCount: todayCompletedRides.length,
        completedRidesCount: completedRides.length,
        todayEarnings,
        totalEarnings,
        rating: driver.rating,
        totalRatings: driver.totalRatings || 0
      },
      availableRequests,
      recentRides
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Driver Operational Status (Online / Offline)
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.session.user._id }).populate('user');

    if (!driver || !driver.user) {
      req.flash('error', 'Driver profile not found.');
      return res.redirect('/login');
    }

    if (!driver.user.isActive) {
      req.flash('error', 'Your driver account has been deactivated by administration.');
      return res.redirect('/driver/dashboard');
    }

    if (!driver.isApproved) {
      req.flash('warning', 'Your driver account is awaiting admin approval before going online.');
      return res.redirect('/driver/dashboard');
    }

    const { status } = req.body;
    const newStatus = status === 'online' ? 'online' : 'offline';

    driver.driverStatus = newStatus;
    await driver.save();

    req.flash('success', `You are now ${newStatus.toUpperCase()}.`);
    return res.redirect('/driver/dashboard');

  } catch (error) {
    next(error);
  }
};

/**
 * Show Available Ride Requests Page
 */
exports.showRideRequests = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.session.user._id });

    if (!driver.isApproved) {
      req.flash('warning', 'Your driver account is awaiting admin approval.');
      return res.redirect('/driver/dashboard');
    }

    if (driver.driverStatus !== 'online') {
      req.flash('info', 'Please go online to view available ride requests.');
      return res.redirect('/driver/dashboard');
    }

    const rejections = await RideRejection.find({ driver: driver._id }).select('ride');
    const rejectedRideIds = rejections.map(r => r.ride);

    const requests = await Ride.find({
      status: 'requested',
      driver: null,
      _id: { $nin: rejectedRideIds }
    })
    .populate('customer', 'fullName phone')
    .sort({ createdAt: -1 });

    res.render('driver/rides/requests', {
      title: 'Available Ride Requests',
      page: 'ride-requests',
      driver,
      requests
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Show Detailed Ride Request
 */
exports.showRideRequest = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('customer', 'fullName phone');

    if (!ride || ride.status !== 'requested' || ride.driver) {
      req.flash('error', 'This ride request is no longer available.');
      return res.redirect('/driver/rides/requests');
    }

    res.render('driver/rides/request-detail', {
      title: `Request Details — ${ride.bookingId}`,
      page: 'request-detail',
      ride
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Accept a Ride (Atomic Assignment)
 */
exports.acceptRide = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.session.user._id });

    if (!driver.isApproved) {
      req.flash('warning', 'Your driver account is awaiting admin approval.');
      return res.redirect('/driver/dashboard');
    }

    if (driver.driverStatus !== 'online') {
      req.flash('error', 'Please go online before accepting a ride.');
      return res.redirect('/driver/dashboard');
    }

    // Check if driver ALREADY has an active ride
    const existingActiveRide = await Ride.findOne({
      driver: driver._id,
      status: { $in: ['accepted', 'driver_arriving', 'driver_arrived', 'started'] }
    });

    if (existingActiveRide) {
      req.flash('error', 'You already have an active ride. Please complete your current ride first.');
      return res.redirect('/driver/rides/current');
    }

    // Atomic MongoDB Update to prevent double assignment race conditions
    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'requested',
        driver: null
      },
      {
        driver: driver._id,
        status: 'accepted',
        acceptedAt: new Date()
      },
      { new: true }
    );

    if (!updatedRide) {
      req.flash('error', 'This ride has already been accepted by another driver or is no longer available.');
      return res.redirect('/driver/rides/requests');
    }

    req.flash('success', `Ride ${updatedRide.bookingId} accepted! Proceed to pickup location.`);
    return res.redirect('/driver/rides/current');

  } catch (error) {
    next(error);
  }
};

/**
 * Reject a Ride (Hidden for current driver, stays 'requested' for others)
 */
exports.rejectRide = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.session.user._id });

    await RideRejection.updateOne(
      { driver: driver._id, ride: req.params.id },
      { driver: driver._id, ride: req.params.id },
      { upsert: true }
    );

    req.flash('info', 'Ride request rejected.');
    return res.redirect('/driver/rides/requests');

  } catch (error) {
    next(error);
  }
};

/**
 * Show Driver's Current Active Ride
 */
exports.showCurrentRide = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.session.user._id }).populate('vehicle');

    const activeRide = await Ride.findOne({
      driver: driver._id,
      status: { $in: ['accepted', 'driver_arriving', 'driver_arrived', 'started'] }
    }).populate('customer', 'fullName phone');

    res.render('driver/rides/current', {
      title: 'Current Active Ride',
      page: 'current-ride',
      driver,
      vehicle: driver.vehicle,
      ride: activeRide
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Progress Ride Operational Status
 */
exports.updateRideStatus = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.session.user._id });
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      req.flash('error', 'Ride not found.');
      return res.redirect('/driver/dashboard');
    }

    // Ownership check
    if (!ride.driver || ride.driver.toString() !== driver._id.toString()) {
      req.flash('error', 'Unauthorized access to this ride.');
      return res.redirect('/driver/dashboard');
    }

    const { targetStatus } = req.body;

    // Strict status transition rules
    const allowedTransitions = {
      accepted: 'driver_arriving',
      driver_arriving: 'driver_arrived',
      driver_arrived: 'started',
      started: 'completed'
    };

    if (allowedTransitions[ride.status] !== targetStatus) {
      req.flash('error', `Invalid status transition from '${ride.status}' to '${targetStatus}'.`);
      return res.redirect('/driver/rides/current');
    }

    ride.status = targetStatus;

    if (targetStatus === 'started') {
      ride.startedAt = new Date();
    } else if (targetStatus === 'completed') {
      ride.completedAt = new Date();
      ride.paymentStatus = 'paid';
    }

    await ride.save();

    if (targetStatus === 'completed') {
      req.flash('success', `Ride ${ride.bookingId} completed successfully! Rs. ${ride.fare} added to earnings.`);
      return res.redirect('/driver/earnings');
    } else {
      req.flash('info', `Ride status updated to '${targetStatus.replace('_', ' ')}'.`);
      return res.redirect('/driver/rides/current');
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Show Driver Ride History Page
 */
exports.showRideHistory = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.session.user._id });

    const rides = await Ride.find({ driver: driver._id })
      .populate('customer', 'fullName phone')
      .sort({ createdAt: -1 });

    res.render('driver/rides/history', {
      title: 'Driver Ride History',
      page: 'driver-history',
      driver,
      rides
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Show Driver Earnings Page
 */
exports.showEarnings = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.session.user._id });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const completedRides = await Ride.find({ driver: driver._id, status: 'completed' })
      .populate('customer', 'fullName')
      .sort({ completedAt: -1 });

    const todayCompletedRides = completedRides.filter(r => new Date(r.completedAt || r.updatedAt) >= startOfToday);

    const totalEarnings = completedRides.reduce((sum, r) => sum + r.fare, 0);
    const todayEarnings = todayCompletedRides.reduce((sum, r) => sum + r.fare, 0);
    const avgFare = completedRides.length > 0 ? Math.round(totalEarnings / completedRides.length) : 0;

    res.render('driver/earnings', {
      title: 'My Earnings',
      page: 'driver-earnings',
      driver,
      completedRides,
      stats: {
        todayEarnings,
        totalEarnings,
        completedCount: completedRides.length,
        todayCount: todayCompletedRides.length,
        avgFare
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Show Driver Profile Page
 */
exports.showProfile = async (req, res, next) => {
  try {
    const user = req.session.user;
    const driver = await Driver.findOne({ user: user._id }).populate('vehicle');

    res.render('profile', {
      title: 'Driver Profile',
      page: 'profile',
      user,
      driver,
      vehicle: driver ? driver.vehicle : null
    });
  } catch (error) {
    next(error);
  }
};
