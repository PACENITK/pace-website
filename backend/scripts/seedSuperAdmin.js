const connectDB = require('../config/db');
const config = require('../config/env');
const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const email = config.SUPER_ADMIN_EMAIL.toLowerCase();
    const name = config.SUPER_ADMIN_NAME;

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Super Admin already exists with email: ${email}`);
      process.exit(0);
    }

    const superAdmin = await User.create({
      role: 'super_admin',
      name,
      email,
      passwordHash: 'Admin@123',
      verified: true,
      status: 'approved'
    });

    console.log(`Super Admin seeded successfully!`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Password: Admin@123 (Please change this immediately)`);
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding Super Admin: ${error.message}`);
    process.exit(1);
  }
};

seedSuperAdmin();
