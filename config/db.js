const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn(`[Database Warning] MONGODB_URI is not set. Please configure MONGODB_URI environment variable.`);
    return;
  }

  // If connection is already open, reuse it
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  // Cache the connection promise to prevent duplicate connections during simultaneous serverless invocations
  if (!cachedPromise) {
    cachedPromise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000
    }).then(m => {
      console.log(`[Database] MongoDB Connected Successfully: ${m.connection.host}`);
      return m;
    }).catch(err => {
      cachedPromise = null;
      console.error(`[Database Error] Failed to connect to MongoDB: ${err.message}`);
      throw err;
    });
  }

  return cachedPromise;
};

module.exports = connectDB;
