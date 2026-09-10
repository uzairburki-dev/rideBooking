const Ride = require('../models/Ride');
const Payment = require('../models/Payment');

/**
 * Customer Dashboard Controller
 */
const showDashboard = async (req, res, next) => {
  try {
    const userId = req.session.user._id;

    // Real MongoDB query metrics restricted strictly to authenticated customer
    const totalRides = await Ride.countDocuments({ customer: userId });
    const completedRides = await Ride.countDocuments({ customer: userId, status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ customer: userId, status: 'cancelled' });
    const activeRidesCount = await Ride.countDocuments({
      customer: userId,
      status: { $in: ['requested', 'accepted', 'driver_arriving', 'driver_arrived', 'started'] }
    });

    // Real Payment Metrics
    const userPayments = await Payment.find({ customer: userId, status: 'paid' });
    const totalPaid = userPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPaymentsCount = await Ride.countDocuments({ customer: userId, status: 'completed', paymentStatus: 'pending' });
    
    // Find customer's active ride
    const activeRide = await Ride.findOne({
      customer: userId,
      status: { $in: ['requested', 'accepted', 'driver_arriving', 'driver_arrived', 'started'] }
    })
    .populate({
      path: 'driver',
      populate: [
        { path: 'user', select: 'fullName phone' },
        { path: 'vehicle' }
      ]
    })
    .sort({ createdAt: -1 });

    // Latest 5 rides sorted by createdAt: -1
    const recentRides = await Ride.find({ customer: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('customer/dashboard', {
      title: 'Customer Dashboard',
      page: 'customer-dashboard',
      user: req.session.user,
      stats: {
        totalRides,
        completedRides,
        cancelledRides,
        activeRidesCount,
        totalPaid,
        pendingPaymentsCount
      },
      activeRide,
      recentRides
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  showDashboard,
  getDashboard: showDashboard
};
