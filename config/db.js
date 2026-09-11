const mongoose = require('mongoose');

let connPromise = null;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn(`[Database Warning] MONGODB_URI is not set. Please configure MONGODB_URI environment variable.`);
    return null;
  }

  // Reuse active connection if open
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!connPromise) {
    connPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    }).then(m => {
      console.log(`[Database] MongoDB Connected Successfully: ${m.connection.host}`);
      return m;
    }).catch(err => {
      connPromise = null;
      console.error(`[Database Error] Failed to connect to MongoDB: ${err.message}`);
      throw err;
    });
  }

  return connPromise;
};

const getClientPromise = () => {
  if (!process.env.MONGODB_URI) return Promise.resolve(null);
  return connectDB().then(conn => {
    return conn ? conn.connection.getClient() : null;
  }).catch(() => null);
};

module.exports = { connectDB, getClientPromise };
