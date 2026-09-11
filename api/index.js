const app = require('../app');
const { connectDB } = require('../config/db');

// Ensure MongoDB connection is initialized for every Vercel serverless request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[Vercel Serverless DB Error]:', error);
    next(error);
  }
});

module.exports = app;
