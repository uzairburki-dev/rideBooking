const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Modern mongoose options are enabled by default in Mongoose 6+
    });
    console.log(`[Database] MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    console.warn(`[Database Warning] Running application in disconnected DB state. Please check your MONGODB_URI in .env`);
  }
};

module.exports = connectDB;
