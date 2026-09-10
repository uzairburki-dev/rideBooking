const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Ride = require('../models/Ride');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

/**
 * Helper to build Date filter for query aggregations
 */
function getDateFilter(range) {
  if (!range || range === 'all') return {};
  const now = new Date();
  const startDate = new Date();
  
  if (range === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === '7days') {
    startDate.setDate(now.getDate() - 7);
  } else if (range === '30days') {
    startDate.setDate(now.getDate() - 30);
  } else if (range === 'thisMonth') {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  } else {
    return {};
  }
  return { createdAt: { $gte: startDate } };
}

/**
 * Admin Dashboard Controller
 * GET /admin/dashboard
 */
exports.showDashboard = async (req, res, next) => {
  try {
    // 1. Customers Metrics
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const activeCustomers = await User.countDocuments({ role: 'customer', isActive: true });
    const inactiveCustomers = await User.countDocuments({ role: 'customer', isActive: false });

    // 2. Drivers Metrics
    const totalDrivers = await Driver.countDocuments();
    const approvedDrivers = await Driver.countDocuments({ $or: [{ isApproved: true }, { approvalStatus: 'approved' }] });
    const pendingDrivers = await Driver.countDocuments({ isApproved: false, approvalStatus: { $ne: 'rejected' } });
    const rejectedDrivers = await Driver.countDocuments({ approvalStatus: 'rejected' });
    const onlineDrivers = await Driver.countDocuments({ driverStatus: 'online' });

    // 3. Rides Metrics
    const totalRides = await Ride.countDocuments();
    const requestedRides = await Ride.countDocuments({ status: 'requested' });
    const activeRides = await Ride.countDocuments({ status: { $in: ['accepted', 'driver_arriving', 'driver_arrived', 'started'] } });
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ status: 'cancelled' });

    // 4. Payments Metrics
    const totalPaymentsCount = await Payment.countDocuments();
    const paidPaymentsCount = await Payment.countDocuments({ status: 'paid' });
    const pendingPaymentsCount = await Payment.countDocuments({ status: 'pending' });
    const failedPaymentsCount = await Payment.countDocuments({ status: 'failed' });
    const refundedPaymentsCount = await Payment.countDocuments({ status: 'refunded' });

    const paidPayments = await Payment.find({ status: 'paid' });
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    // 5. Reviews Metrics
    const totalReviews = await Review.countDocuments();
    const allReviews = await Review.find();
    const avgRating = totalReviews > 0 ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0.0';

    // 6. Recent Logs
    const recentRides = await Ride.find()
      .populate('customer', 'fullName')
      .populate({ path: 'driver', populate: { path: 'user', select: 'fullName' } })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPayments = await Payment.find()
      .populate('customer', 'fullName')
      .populate('ride', 'bookingId')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReviews = await Review.find()
      .populate('customer', 'fullName')
      .populate({ path: 'driver', populate: { path: 'user', select: 'fullName' } })
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('admin/dashboard', {
      title: 'System Administration Dashboard',
      page: 'admin-dashboard',
      user: req.session.user,
      stats: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        totalDrivers,
        approvedDrivers,
        pendingDrivers,
        rejectedDrivers,
        onlineDrivers,
        totalRides,
        requestedRides,
        activeRides,
        completedRides,
        cancelledRides,
        totalPaymentsCount,
        paidPaymentsCount,
        pendingPaymentsCount,
        failedPaymentsCount,
        refundedPaymentsCount,
        totalRevenue,
        totalReviews,
        avgRating
      },
      recentRides,
      recentPayments,
      recentReviews
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Customer Management Index
 * GET /admin/customers
 */
exports.showCustomers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = { role: 'customer' };

    if (status && status !== 'all') {
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
    }

    const customers = await User.find(query).sort({ createdAt: -1 });

    // Aggregate ride metrics per customer
    const customersWithStats = await Promise.all(
      customers.map(async (cust) => {
        const totalRides = await Ride.countDocuments({ customer: cust._id });
        const completedRides = await Ride.countDocuments({ customer: cust._id, status: 'completed' });
        return {
          ...cust.toObject(),
          totalRides,
          completedRides
        };
      })
    );

    res.render('admin/customers/index', {
      title: 'Customer Management',
      page: 'admin-customers',
      customers: customersWithStats,
      search: search || '',
      currentStatus: status || 'all'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Show Customer Details
 * GET /admin/customers/:id
 */
exports.showCustomerDetails = async (req, res, next) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });

    if (!customer) {
      req.flash('error', 'Customer not found.');
      return res.redirect('/admin/customers');
    }

    const rides = await Ride.find({ customer: customer._id })
      .populate({ path: 'driver', populate: { path: 'user', select: 'fullName' } })
      .sort({ createdAt: -1 });

    const totalRides = rides.length;
    const completedRides = rides.filter(r => r.status === 'completed').length;
    const cancelledRides = rides.filter(r => r.status === 'cancelled').length;

    const payments = await Payment.find({ customer: customer._id, status: 'paid' });
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

    res.render('admin/customers/show', {
      title: `Customer Profile — ${customer.fullName}`,
      page: 'admin-customers',
      customer,
      stats: {
        totalRides,
        completedRides,
        cancelledRides,
        totalSpent
      },
      rides
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      req.flash('error', 'Invalid customer ID.');
      return res.redirect('/admin/customers');
    }
    next(error);
  }
};

/**
 * Toggle Customer Account Status
 * POST /admin/customers/:id/status
 */
exports.toggleCustomerStatus = async (req, res, next) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });

    if (!customer) {
      req.flash('error', 'Customer not found.');
      return res.redirect('/admin/customers');
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    req.flash('success', `Customer ${customer.fullName} account has been ${customer.isActive ? 'activated' : 'deactivated'}.`);
    return res.redirect(`/admin/customers/${customer._id}`);

  } catch (error) {
    next(error);
  }
};

/**
 * Driver Management Index
 * GET /admin/drivers
 */
exports.showDrivers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    
    let drivers = await Driver.find()
      .populate('user')
      .populate('vehicle')
      .sort({ createdAt: -1 });

    // Search filter
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      drivers = drivers.filter(d => 
        (d.user && d.user.fullName.toLowerCase().includes(s)) ||
        (d.user && d.user.email.toLowerCase().includes(s)) ||
        (d.user && d.user.phone.includes(s)) ||
        (d.licenseNumber && d.licenseNumber.toLowerCase().includes(s))
      );
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'pending') {
        drivers = drivers.filter(d => !d.isApproved && d.approvalStatus !== 'rejected');
      } else if (status === 'approved') {
        drivers = drivers.filter(d => d.isApproved || d.approvalStatus === 'approved');
      } else if (status === 'rejected') {
        drivers = drivers.filter(d => d.approvalStatus === 'rejected');
      } else if (status === 'active') {
        drivers = drivers.filter(d => d.user && d.user.isActive);
      } else if (status === 'inactive') {
        drivers = drivers.filter(d => d.user && !d.user.isActive);
      }
    }

    res.render('admin/drivers/index', {
      title: 'Driver Management',
      page: 'admin-drivers',
      drivers,
      search: search || '',
      currentStatus: status || 'all'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Driver Pending Approvals Queue
 * GET /admin/drivers/pending
 */
exports.showPendingDrivers = async (req, res, next) => {
  try {
    const pendingDrivers = await Driver.find({ 
      isApproved: false, 
      approvalStatus: { $ne: 'rejected' } 
    })
    .populate('user')
    .populate('vehicle')
    .sort({ createdAt: -1 });

    res.render('admin/drivers/pending', {
      title: 'Pending Driver Approvals Queue',
      page: 'admin-pending-drivers',
      drivers: pendingDrivers
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Show Driver Details
 * GET /admin/drivers/:id
 */
exports.showDriverDetails = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('user')
      .populate('vehicle');

    if (!driver) {
      req.flash('error', 'Driver not found.');
      return res.redirect('/admin/drivers');
    }

    const rides = await Ride.find({ driver: driver._id })
      .populate('customer', 'fullName')
      .sort({ createdAt: -1 });

    const totalRides = rides.length;
    const completedRides = rides.filter(r => r.status === 'completed');
    const cancelledRides = rides.filter(r => r.status === 'cancelled').length;

    const totalEarnings = completedRides.reduce((sum, r) => sum + r.fare, 0);

    const reviews = await Review.find({ driver: driver._id })
      .populate('customer', 'fullName')
      .sort({ createdAt: -1 });

    res.render('admin/drivers/show', {
      title: `Driver Profile — ${driver.user ? driver.user.fullName : 'Driver'}`,
      page: 'admin-drivers',
      driver,
      user: driver.user,
      vehicle: driver.vehicle,
      stats: {
        totalRides,
        completedCount: completedRides.length,
        cancelledCount: cancelledRides,
        totalEarnings,
        rating: driver.rating,
        totalRatings: driver.totalRatings
      },
      rides,
      reviews
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      req.flash('error', 'Invalid driver ID.');
      return res.redirect('/admin/drivers');
    }
    next(error);
  }
};

/**
 * Approve Driver Application
 * POST /admin/drivers/:id/approve
 */
exports.approveDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('user');

    if (!driver) {
      req.flash('error', 'Driver not found.');
      return res.redirect('/admin/drivers/pending');
    }

    driver.isApproved = true;
    driver.approvalStatus = 'approved';
    driver.rejectionReason = null;

    if (driver.user) {
      driver.user.isActive = true;
      await driver.user.save();
    }

    await driver.save();

    req.flash('success', `Driver ${driver.user ? driver.user.fullName : ''} has been approved successfully!`);
    return res.redirect(`/admin/drivers/${driver._id}`);

  } catch (error) {
    next(error);
  }
};

/**
 * Reject Driver Application
 * POST /admin/drivers/:id/reject
 */
exports.rejectDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('user');

    if (!driver) {
      req.flash('error', 'Driver not found.');
      return res.redirect('/admin/drivers/pending');
    }

    driver.isApproved = false;
    driver.approvalStatus = 'rejected';
    driver.driverStatus = 'offline';
    driver.rejectionReason = req.body.rejectionReason || 'Application details did not meet criteria.';

    await driver.save();

    req.flash('warning', `Driver application for ${driver.user ? driver.user.fullName : ''} has been rejected.`);
    return res.redirect(`/admin/drivers/${driver._id}`);

  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Driver Account Active Status
 * POST /admin/drivers/:id/status
 */
exports.toggleDriverStatus = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('user');

    if (!driver || !driver.user) {
      req.flash('error', 'Driver record or user account not found.');
      return res.redirect('/admin/drivers');
    }

    driver.user.isActive = !driver.user.isActive;
    await driver.user.save();

    if (!driver.user.isActive) {
      driver.driverStatus = 'offline';
      await driver.save();
    }

    req.flash('success', `Driver ${driver.user.fullName} account status has been updated to ${driver.user.isActive ? 'Active' : 'Inactive'}.`);
    return res.redirect(`/admin/drivers/${driver._id}`);

  } catch (error) {
    next(error);
  }
};

/**
 * Ride Management Index
 * GET /admin/rides
 */
exports.showRides = async (req, res, next) => {
  try {
    const { search, status, paymentStatus } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (search && search.trim()) {
      query.bookingId = new RegExp(search.trim(), 'i');
    }

    const rides = await Ride.find(query)
      .populate('customer', 'fullName')
      .populate({ path: 'driver', populate: { path: 'user', select: 'fullName' } })
      .sort({ createdAt: -1 });

    res.render('admin/rides/index', {
      title: 'Ride Management',
      page: 'admin-rides',
      rides,
      search: search || '',
      currentStatus: status || 'all',
      currentPaymentStatus: paymentStatus || 'all'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Show Ride Details Page
 * GET /admin/rides/:id
 */
exports.showRideDetails = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('customer', 'fullName email phone')
      .populate({ path: 'driver', populate: [{ path: 'user', select: 'fullName phone' }, { path: 'vehicle' }] });

    if (!ride) {
      req.flash('error', 'Ride not found.');
      return res.redirect('/admin/rides');
    }

    const payment = await Payment.findOne({ ride: ride._id });
    const review = await Review.findOne({ ride: ride._id });

    res.render('admin/rides/show', {
      title: `Ride Inspection — ${ride.bookingId}`,
      page: 'admin-rides',
      ride,
      payment,
      review
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      req.flash('error', 'Invalid ride ID.');
      return res.redirect('/admin/rides');
    }
    next(error);
  }
};

/**
 * Payment Management Index
 * GET /admin/payments
 */
exports.showPayments = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ transactionReference: regex }, { paymentId: regex }];
    }

    const payments = await Payment.find(query)
      .populate('customer', 'fullName')
      .populate({ path: 'driver', populate: { path: 'user', select: 'fullName' } })
      .populate('ride', 'bookingId')
      .sort({ createdAt: -1 });

    res.render('admin/payments/index', {
      title: 'Payment Management Log',
      page: 'admin-payments',
      payments,
      search: search || '',
      currentStatus: status || 'all'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Show Payment Details
 * GET /admin/payments/:id
 */
exports.showPaymentDetails = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'fullName email phone')
      .populate({ path: 'driver', populate: [{ path: 'user', select: 'fullName phone' }, { path: 'vehicle' }] })
      .populate('ride');

    if (!payment) {
      req.flash('error', 'Payment record not found.');
      return res.redirect('/admin/payments');
    }

    res.render('admin/payments/show', {
      title: `Payment Record — ${payment.transactionReference}`,
      page: 'admin-payments',
      payment,
      ride: payment.ride
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      req.flash('error', 'Invalid payment ID.');
      return res.redirect('/admin/payments');
    }
    next(error);
  }
};

/**
 * Review Management Index
 * GET /admin/reviews
 */
exports.showReviews = async (req, res, next) => {
  try {
    const { rating } = req.query;
    const query = {};

    if (rating && ['1', '2', '3', '4', '5'].includes(rating)) {
      query.rating = parseInt(rating, 10);
    }

    const reviews = await Review.find(query)
      .populate('customer', 'fullName')
      .populate({ path: 'driver', populate: { path: 'user', select: 'fullName' } })
      .populate('ride', 'bookingId')
      .sort({ createdAt: -1 });

    res.render('admin/reviews/index', {
      title: 'Customer Review Management',
      page: 'admin-reviews',
      reviews,
      currentRating: rating || 'all'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete Inappropriate Review & Recalculate Driver Rating
 * POST /admin/reviews/:id/delete
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      req.flash('error', 'Review not found.');
      return res.redirect('/admin/reviews');
    }

    const driverId = review.driver;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate Driver Rating & Total Ratings
    const remainingReviews = await Review.find({ driver: driverId });
    const totalRatings = remainingReviews.length;
    const avgRating = totalRatings > 0 
      ? Math.round((remainingReviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10 
      : 0;

    await Driver.findByIdAndUpdate(driverId, {
      rating: avgRating,
      totalRatings
    });

    req.flash('success', 'Review deleted and driver average score updated successfully.');
    return res.redirect('/admin/reviews');

  } catch (error) {
    next(error);
  }
};

/**
 * System Reports & Analytics
 * GET /admin/reports
 */
exports.showReports = async (req, res, next) => {
  try {
    const { dateRange } = req.query;
    const dateFilter = getDateFilter(dateRange);

    // 1. Ride Analytics
    const totalRides = await Ride.countDocuments(dateFilter);
    const completedRides = await Ride.countDocuments({ ...dateFilter, status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ ...dateFilter, status: 'cancelled' });
    const activeRides = await Ride.countDocuments({ ...dateFilter, status: { $in: ['accepted', 'driver_arriving', 'driver_arrived', 'started'] } });
    const completionRate = totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0;

    // 2. Revenue Analytics
    const paidPayments = await Payment.find({ ...dateFilter, status: 'paid' });
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = await Payment.find({ ...dateFilter, status: 'pending' });
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    const failedPayments = await Payment.find({ ...dateFilter, status: 'failed' });
    const failedRevenue = failedPayments.reduce((sum, p) => sum + p.amount, 0);

    // 3. Driver Analytics
    const totalDrivers = await Driver.countDocuments();
    const approvedDrivers = await Driver.countDocuments({ $or: [{ isApproved: true }, { approvalStatus: 'approved' }] });
    const pendingDrivers = await Driver.countDocuments({ isApproved: false, approvalStatus: { $ne: 'rejected' } });
    const rejectedDrivers = await Driver.countDocuments({ approvalStatus: 'rejected' });
    const onlineDrivers = await Driver.countDocuments({ driverStatus: 'online' });

    // 4. Customer Analytics
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const activeCustomers = await User.countDocuments({ role: 'customer', isActive: true });

    // 5. Rating Analytics
    const reviews = await Review.find(dateFilter);
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0.0';
    
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (ratingBreakdown[r.rating] !== undefined) ratingBreakdown[r.rating]++;
    });

    res.render('admin/reports/index', {
      title: 'System Reports & Analytics',
      page: 'admin-reports',
      currentRange: dateRange || 'all',
      metrics: {
        totalRides,
        completedRides,
        cancelledRides,
        activeRides,
        completionRate,
        totalRevenue,
        pendingRevenue,
        failedRevenue,
        totalDrivers,
        approvedDrivers,
        pendingDrivers,
        rejectedDrivers,
        onlineDrivers,
        totalCustomers,
        activeCustomers,
        totalReviews,
        avgRating,
        ratingBreakdown
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Admin Profile Page
 * GET /admin/profile
 */
exports.showProfile = (req, res) => {
  res.render('admin/profile', {
    title: 'Admin Profile',
    page: 'admin-profile',
    user: req.session.user
  });
};
