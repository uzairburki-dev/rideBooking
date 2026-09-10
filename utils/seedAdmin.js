const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ridego_db';
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB for admin seeding...`);

    const adminEmail = 'admin@ridego.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin account already exists: ${adminEmail}`);
    } else {
      const adminUser = new User({
        fullName: 'System Administrator',
        email: adminEmail,
        phone: '+1 (800) 555-ADMIN',
        password: 'adminPassword123',
        role: 'admin',
        isActive: true
      });

      await adminUser.save();
      console.log(`=======================================================`);
      console.log(`  👑 Admin account created successfully!`);
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: adminPassword123`);
      console.log(`=======================================================`);
    }

    await mongoose.disconnect();
    console.log(`Disconnected from MongoDB.`);
  } catch (error) {
    console.error(`Seeding error:`, error);
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
