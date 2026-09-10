const Payment = require('../models/Payment');
const Ride = require('../models/Ride');

/**
 * Helper to generate unique IDs
 */
function generateTxnRef() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RG-TXN-${dateStr}-${randStr}`;
}

function generatePaymentId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${dateStr}-${randStr}`;
}

/**
 * Render Payment Checkout Page
 * GET /customer/payments/:rideId
 */
exports.showPaymentPage = async (req, res, next) => {
  try {
    const { rideId } = req.params;

    // Find Ride
    const ride = await Ride.findById(rideId).populate({
      path: 'driver',
      populate: [{ path: 'user', select: 'fullName phone' }, { path: 'vehicle' }]
    });

    if (!ride) {
      req.flash('error', 'Ride not found.');
      return res.redirect('/customer/rides');
    }

    // Customer Ownership Check
    if (ride.customer.toString() !== req.session.user._id.toString()) {
      req.flash('error', 'Unauthorized access to ride payment.');
      return res.redirect('/customer/rides');
    }

    // Prevent payment for cancelled rides
    if (ride.status === 'cancelled') {
      req.flash('error', 'Cannot process payment for a cancelled ride.');
      return res.redirect(`/customer/rides/${ride._id}`);
    }

    // Check if ride is already paid
    const existingPaid = await Payment.findOne({ ride: ride._id, status: 'paid' });
    if (ride.paymentStatus === 'paid' || existingPaid) {
      req.flash('info', 'This ride has already been paid successfully.');
      if (existingPaid) {
        return res.redirect(`/customer/payments/details/${existingPaid._id}`);
      }
      return res.redirect(`/customer/rides/${ride._id}`);
    }

    res.render('customer/payments/pay', {
      title: `Checkout Payment — ${ride.bookingId}`,
      page: 'pay-ride',
      ride,
      amount: ride.fare,
      currency: 'PKR'
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      req.flash('error', 'Invalid ride reference.');
      return res.redirect('/customer/rides');
    }
    next(error);
  }
};

/**
 * Process Demo Payment Submission
 * POST /customer/payments/:rideId/process
 */
exports.processPayment = async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const { method: selectedMethod, cardNumber, cvv } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      req.flash('error', 'Ride not found.');
      return res.redirect('/customer/rides');
    }

    // Customer Ownership Check
    if (ride.customer.toString() !== req.session.user._id.toString()) {
      req.flash('error', 'Unauthorized attempt to pay for ride.');
      return res.redirect('/customer/rides');
    }

    // Prevent payment for cancelled rides
    if (ride.status === 'cancelled') {
      req.flash('error', 'Cannot process payment for a cancelled ride.');
      return res.redirect(`/customer/rides/${ride._id}`);
    }

    // Prevent duplicate payment
    const existingPaid = await Payment.findOne({ ride: ride._id, status: 'paid' });
    if (ride.paymentStatus === 'paid' || existingPaid) {
      req.flash('error', 'This ride has already been paid.');
      return res.redirect(`/customer/rides/${ride._id}`);
    }

    // Validate payment method
    const method = ['Demo Card', 'Cash'].includes(selectedMethod) ? selectedMethod : 'Demo Card';

    // SERVER-SIDE AMOUNT ENFORCEMENT: amount strictly from ride.fare
    const amount = ride.fare;
    const driverId = ride.driver ? (ride.driver._id || ride.driver) : null;

    if (method === 'Demo Card') {
      // Simulated failure trigger (if card ends with '0000' or CVV is '000')
      const cleanCard = (cardNumber || '').replace(/\s+/g, '');
      if (cleanCard.endsWith('0000') || cvv === '000') {
        const failedPayment = new Payment({
          paymentId: generatePaymentId(),
          transactionReference: generateTxnRef(),
          ride: ride._id,
          customer: req.session.user._id,
          driver: driverId,
          amount,
          currency: 'PKR',
          method: 'Demo Card',
          status: 'failed'
        });
        await failedPayment.save();

        req.flash('error', 'Payment failed! Simulated card decline. Please try again with a valid demo card.');
        return res.redirect(`/customer/payments/${ride._id}`);
      }

      // Successful Demo Card payment
      const payment = new Payment({
        paymentId: generatePaymentId(),
        transactionReference: generateTxnRef(),
        ride: ride._id,
        customer: req.session.user._id,
        driver: driverId,
        amount,
        currency: 'PKR',
        method: 'Demo Card',
        status: 'paid',
        paidAt: new Date()
      });

      await payment.save();

      // Update Ride paymentStatus
      ride.paymentStatus = 'paid';
      await ride.save();

      req.flash('success', `Payment of Rs. ${amount} processed successfully! Ref: ${payment.transactionReference}`);
      return res.redirect(`/customer/payments/success/${payment._id}`);

    } else if (method === 'Cash') {
      // Cash payment -> set Payment status = pending
      const payment = new Payment({
        paymentId: generatePaymentId(),
        transactionReference: generateTxnRef(),
        ride: ride._id,
        customer: req.session.user._id,
        driver: driverId,
        amount,
        currency: 'PKR',
        method: 'Cash',
        status: 'pending'
      });

      await payment.save();

      req.flash('info', 'Cash payment selected. Please hand the cash fare to your driver upon trip completion.');
      return res.redirect(`/customer/payments/details/${payment._id}`);
    }

  } catch (error) {
    console.error('[Process Payment Error]:', error);
    req.flash('error', 'An error occurred while processing payment. Please try again.');
    return res.redirect(`/customer/payments/${req.params.rideId}`);
  }
};

/**
 * Show Payment Success Confirmation
 * GET /customer/payments/success/:paymentId
 */
exports.showPaymentSuccess = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate({
        path: 'ride',
        populate: [{ path: 'driver', populate: [ { path: 'user', select: 'fullName phone' }, { path: 'vehicle' } ] }]
      })
      .populate('customer', 'fullName email phone');

    if (!payment) {
      req.flash('error', 'Payment record not found.');
      return res.redirect('/customer/payments');
    }

    // Ownership Authorization
    if (payment.customer._id.toString() !== req.session.user._id.toString()) {
      req.flash('error', 'Unauthorized access to payment details.');
      return res.redirect('/customer/payments');
    }

    res.render('customer/payments/success', {
      title: `Payment Successful — ${payment.transactionReference}`,
      page: 'payment-success',
      payment,
      ride: payment.ride
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Show Single Payment Details
 * GET /customer/payments/details/:paymentId
 */
exports.showPaymentDetails = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate({
        path: 'ride',
        populate: [{ path: 'driver', populate: [{ path: 'user', select: 'fullName phone' }, { path: 'vehicle' }] }]
      })
      .populate('customer', 'fullName email phone');

    if (!payment) {
      req.flash('error', 'Payment record not found.');
      return res.redirect('/customer/payments');
    }

    // Ownership Authorization
    if (payment.customer._id.toString() !== req.session.user._id.toString()) {
      req.flash('error', 'Unauthorized access to payment details.');
      return res.redirect('/customer/payments');
    }

    res.render('customer/payments/show', {
      title: `Payment Receipt — ${payment.transactionReference}`,
      page: 'payment-details',
      payment,
      ride: payment.ride
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      req.flash('error', 'Invalid payment ID.');
      return res.redirect('/customer/payments');
    }
    next(error);
  }
};

/**
 * Show Customer Payment History
 * GET /customer/payments
 */
exports.showPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ customer: req.session.user._id })
      .populate({
        path: 'ride',
        select: 'bookingId pickup destination rideType distance fare status'
      })
      .sort({ createdAt: -1 });

    res.render('customer/payments/index', {
      title: 'My Payment History',
      page: 'payment-history',
      payments
    });

  } catch (error) {
    next(error);
  }
};
