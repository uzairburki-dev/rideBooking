const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');

/**
 * Render Login Page
 */
exports.getLoginPage = (req, res) => {
  res.render('auth/login', {
    title: 'Sign In to Your Account',
    page: 'login'
  });
};

/**
 * Handle User Login
 */
exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Please enter both email and password.');
      return res.redirect('/login');
    }

    // Find user by normalized email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Check account status
    if (!user.isActive) {
      req.flash('error', 'Your account has been deactivated. Please contact support.');
      return res.redirect('/login');
    }

    // Verify bcrypt password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Save session
    req.session.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive
    };

    req.flash('success', `Welcome back, ${user.fullName}!`);

    // Redirect according to role
    if (user.role === 'customer') {
      return res.redirect('/customer/dashboard');
    } else if (user.role === 'driver') {
      return res.redirect('/driver/dashboard');
    } else if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }

    return res.redirect('/dashboard');

  } catch (error) {
    console.error('[Login Error]:', error);
    req.flash('error', 'An unexpected error occurred during login.');
    return res.redirect('/login');
  }
};

/**
 * Render Customer Registration Page
 */
exports.getRegisterPage = (req, res) => {
  res.render('auth/register', {
    title: 'Create Customer Account',
    page: 'register'
  });
};

/**
 * Handle Customer Registration
 */
exports.postRegister = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long.');
      return res.redirect('/register');
    }

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/register');
    }

    // Create Customer user
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: 'customer'
    });

    await newUser.save();

    req.flash('success', 'Account created successfully. Please sign in.');
    return res.redirect('/login');

  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/register');
    }
    console.error('[Customer Register Error]:', error);
    req.flash('error', 'Registration failed. Please check your details and try again.');
    return res.redirect('/register');
  }
};

/**
 * Render Driver Registration Page
 */
exports.getDriverRegisterPage = (req, res) => {
  res.render('auth/driver-register', {
    title: 'Become a RideGo Driver',
    page: 'driver-register'
  });
};

/**
 * Handle Driver Registration (User + Driver + Vehicle)
 */
exports.postDriverRegister = async (req, res, next) => {
  try {
    const {
      fullName, email, phone, password, confirmPassword,
      licenseNumber, vehicleType, brand, model, year, registrationNumber, color, seats
    } = req.body;

    // Basic Validation
    if (!fullName || !email || !phone || !password || !confirmPassword || !licenseNumber ||
        !vehicleType || !brand || !model || !year || !registrationNumber || !color || !seats) {
      req.flash('error', 'All driver and vehicle fields are required.');
      return res.redirect('/driver/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/driver/register');
    }

    // Check Duplicate Email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/driver/register');
    }

    // Check Duplicate License Number
    const existingLicense = await Driver.findOne({ licenseNumber: licenseNumber.trim() });
    if (existingLicense) {
      req.flash('error', 'A driver account with this license number already exists.');
      return res.redirect('/driver/register');
    }

    // Check Duplicate Registration Number
    const existingReg = await Vehicle.findOne({ registrationNumber: registrationNumber.trim() });
    if (existingReg) {
      req.flash('error', 'A vehicle with this license plate/registration number is already registered.');
      return res.redirect('/driver/register');
    }

    // 1. Create User
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: 'driver'
    });
    await newUser.save();

    // 2. Create Driver (isApproved defaults to false)
    const newDriver = new Driver({
      user: newUser._id,
      licenseNumber: licenseNumber.trim(),
      isApproved: false
    });
    await newDriver.save();

    // 3. Create Vehicle
    const newVehicle = new Vehicle({
      driver: newDriver._id,
      vehicleType,
      brand: brand.trim(),
      model: model.trim(),
      year: parseInt(year, 10),
      registrationNumber: registrationNumber.trim(),
      color: color.trim(),
      seats: parseInt(seats, 10)
    });
    await newVehicle.save();

    // Link vehicle to driver
    newDriver.vehicle = newVehicle._id;
    await newDriver.save();

    req.flash('success', 'Driver registration submitted successfully. Your account is awaiting admin approval.');
    return res.redirect('/login');

  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'A registration conflict occurred (duplicate email, license, or vehicle plate).');
      return res.redirect('/driver/register');
    }
    console.error('[Driver Register Error]:', error);
    req.flash('error', 'Driver registration failed. Please check your entries and try again.');
    return res.redirect('/driver/register');
  }
};

/**
 * Handle Logout
 */
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[Logout Error]:', err);
    }
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
};

/**
 * Render User Profile Page
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id);
    let driver = null;
    let vehicle = null;

    if (user.role === 'driver') {
      driver = await Driver.findOne({ user: user._id }).populate('vehicle');
      if (driver && driver.vehicle) {
        vehicle = driver.vehicle;
      }
    }

    res.render('profile', {
      title: 'My Profile',
      page: 'profile',
      user,
      driver,
      vehicle
    });
  } catch (error) {
    next(error);
  }
};
