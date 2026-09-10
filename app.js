const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
require('dotenv').config();

const app = express();

// Security Headers (configured to allow CDNs for Bootstrap, FontAwesome & Images)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://images.unsplash.com",
          "https://cdn.jsdelivr.net"
        ]
      }
    }
  })
);

// HTTP request logger
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

// Static files directory
app.use(express.static(path.join(__dirname, 'public')));

// View Engine & Layouts Setup
app.use(expressLayouts);
app.set('layout', 'layouts/boilerplate');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method Override Middleware for RESTful actions
app.use(methodOverride('_method'));

// Trust reverse proxy (Vercel / Heroku / Nginx) in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session Configuration with MongoStore
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'ridego_default_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
};

if (process.env.MONGODB_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy update session once per day
  });
}

app.use(session(sessionConfig));

// Flash messages middleware
app.use(flash());

// Global local variables for EJS views
app.use((req, res, next) => {
  res.locals.appName = 'RideGo';
  res.locals.appTagline = 'Your Ride, Your Journey';
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.warning_msg = req.flash('warning');
  res.locals.info_msg = req.flash('info');
  res.locals.currentPath = req.path;
  res.locals.currentUser = (req.session && req.session.user) ? req.session.user : null;
  next();
});

// Import Routes
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const rideRoutes = require('./routes/rideRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Mount Routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', customerRoutes);
app.use('/', driverRoutes);
app.use('/', adminRoutes);
app.use('/', dashboardRoutes);
app.use('/', reviewRoutes);
app.use('/', paymentRoutes);
app.use('/customer/rides', rideRoutes);

// Error Handling Middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

module.exports = app;
