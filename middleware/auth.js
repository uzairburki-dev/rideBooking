const Driver = require('../models/Driver');

/**
 * Ensures user is authenticated via session
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  return res.redirect('/login');
};

/**
 * Ensures user is guest (unauthenticated) - redirects logged in users to dashboard
 */
exports.isGuest = (req, res, next) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'customer') return res.redirect('/customer/dashboard');
    if (role === 'driver') return res.redirect('/driver/dashboard');
    if (role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/dashboard');
  }
  return next();
};

/**
 * Ensures user has Customer role
 */
exports.isCustomer = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'customer') {
    return next();
  }
  req.flash('error', 'Access denied. Customer account required.');
  return res.redirect('/login');
};

/**
 * Ensures user has Driver role
 */
exports.isDriver = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'driver') {
    return next();
  }
  req.flash('error', 'Access denied. Driver account required.');
  return res.redirect('/login');
};

/**
 * Ensures user has Admin role
 */
exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Access denied. Administrator privileges required.');
  return res.redirect('/login');
};

/**
 * Ensures Driver account is approved by admin
 */
exports.isApprovedDriver = async (req, res, next) => {
  try {
    if (req.session && req.session.user && req.session.user.role === 'driver') {
      const driver = await Driver.findOne({ user: req.session.user._id }).populate('vehicle');
      if (!driver) {
        req.flash('error', 'Driver profile not found.');
        return res.redirect('/login');
      }

      req.driverInfo = driver;
      res.locals.driverInfo = driver;

      if (!driver.isApproved) {
        req.flash('warning', 'Your driver account is awaiting admin approval.');
        // Allow viewing dashboard/profile, but block operational routes
        if (req.path !== '/driver/dashboard' && req.path !== '/driver/profile') {
          return res.redirect('/driver/dashboard');
        }
      }
      return next();
    }
    req.flash('error', 'Access denied. Driver account required.');
    return res.redirect('/login');
  } catch (err) {
    next(err);
  }
};

/**
 * Ensures Driver is Online for accepting requests
 */
exports.isOnlineDriver = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Please log in as a driver.');
      return res.redirect('/login');
    }
    const driver = req.driverInfo || await Driver.findOne({ user: req.session.user._id });
    if (!driver || driver.driverStatus !== 'online') {
      req.flash('error', 'Please go online before managing ride requests.');
      return res.redirect('/driver/dashboard');
    }
    return next();
  } catch (err) {
    next(err);
  }
};

/**
 * Populates driver info for views
 */
exports.checkDriverApproval = async (req, res, next) => {
  try {
    if (req.session && req.session.user && req.session.user.role === 'driver') {
      const driver = await Driver.findOne({ user: req.session.user._id }).populate('vehicle');
      req.driverInfo = driver;
      res.locals.driverInfo = driver;
    }
    next();
  } catch (err) {
    next(err);
  }
};
