const connectDB = require('../config/db');
const User = require('../models/User');
const FacultyList = require('../models/FacultyList');

const facultyMembers = [
  { name: 'Prof. Subhas C Yaragal', email: 'subhascy@nitk.edu.in', department: 'Civil Engineering' },
  { name: 'Prof. Katta Venkataramana', email: 'katta@nitk.edu.in', department: 'Civil Engineering' },
  { name: 'Prof. K S Babunarayan', email: 'satyaks@nitk.edu.in', department: 'Civil Engineering' },
  { name: 'Prof. Varghese George', email: 'varghese@nitk.edu.in', department: 'Civil Engineering' },
  { name: 'Prof. Dwarakish G S', email: 'dwarakish@nitk.edu.in', department: 'Civil Engineering' },
  { name: 'Prof. B M Sunil', email: 'bmsunil@nitk.edu.in', department: 'Civil Engineering' }
];

const seedFacultyList = async () => {
  try {
    await connectDB();

    const superAdmin = await User.findOne({ role: 'super_admin' });
    if (!superAdmin) {
      console.error('Error: Please seed the Super Admin first before seeding the Faculty List.');
      process.exit(1);
    }

    let seededCount = 0;
    for (const faculty of facultyMembers) {
      const email = faculty.email.toLowerCase();
      const existing = await FacultyList.findOne({ email });

      if (!existing) {
        await FacultyList.create({
          name: faculty.name,
          email,
          department: faculty.department,
          addedBy: superAdmin._id
        });
        seededCount++;
      }
    }

    console.log(`Faculty List seeded successfully! ${seededCount} new entries added.`);
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding Faculty List: ${error.message}`);
    process.exit(1);
  }
};

seedFacultyList();
