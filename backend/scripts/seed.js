require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Internship = require('../models/Internship');
const FacultyList = require('../models/FacultyList');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const SystemConfig = require('../models/SystemConfig');

const seedData = async () => {
  try {
    console.log('[SEED] Connecting to database...');
    await connectDB();

    console.log('[SEED] Clearing existing collections...');
    await User.deleteMany({});
    await Internship.deleteMany({});
    await FacultyList.deleteMany({});
    await Application.deleteMany({});
    await AuditLog.deleteMany({});
    await SystemConfig.deleteMany({});
    console.log('[SEED] DB collections cleared successfully.');

    // 1. Seed System Config (Maintenance Mode = Off)
    await SystemConfig.create({ key: 'maintenanceMode', value: false });
    console.log('[SEED] SystemConfig initial state seeded.');

    // 2. Seed Super Admin User
    const superAdmin = await User.create({
      name: 'Dr. Prasad (Super Admin)',
      email: 'prasad@nitk.edu.in',
      role: 'super_admin',
      passwordHash: 'password123',
      verified: true,
      status: 'approved'
    });
    console.log('[SEED] Super Admin created.');

    // 3. Seed Admin User
    const admin = await User.create({
      name: 'Asha Hegde (Admin)',
      email: 'asha@nitk.edu.in',
      role: 'admin',
      passwordHash: 'password123',
      verified: true,
      status: 'approved'
    });
    console.log('[SEED] Admin created.');

    // 4. Seed Pre-approved Faculty Registers
    const faculty1 = await FacultyList.create({
      name: 'Prof. Ramesh Rao',
      email: 'ramesh@nitk.edu.in',
      department: 'Civil Engineering',
      addedBy: superAdmin._id
    });
    const faculty2 = await FacultyList.create({
      name: 'Dr. Suresh Kumar',
      email: 'suresh@nitk.edu.in',
      department: 'Civil Engineering',
      addedBy: superAdmin._id
    });
    const faculty3 = await FacultyList.create({
      name: 'Dr. R. Swaminathan',
      email: 'swaminathan@nitk.edu.in',
      department: 'Mining Engineering',
      addedBy: superAdmin._id
    });
    console.log('[SEED] Pre-approved Faculty list database seeded.');

    // 5. Seed Professor User (Approved)
    const profRamesh = await User.create({
      name: 'Prof. Ramesh Rao',
      email: 'ramesh@nitk.edu.in',
      role: 'professor',
      passwordHash: 'password123',
      verified: true,
      status: 'approved',
      profile: {
        college: 'NITK Surathkal',
        branch: 'Civil Engineering',
        phone: '+91 98765 11111'
      }
    });

    // 6. Seed Professor User (Pending Approval)
    const profSuresh = await User.create({
      name: 'Dr. Suresh Kumar',
      email: 'suresh@nitk.edu.in',
      role: 'professor',
      passwordHash: 'password123',
      verified: false,
      status: 'pending',
      profile: {
        college: 'NITK Surathkal',
        branch: 'Civil Engineering',
        phone: '+91 98765 22222'
      }
    });
    console.log('[SEED] Approved & Pending Professors created.');

    // 7. Seed Student (NITK Surathkal - Verified)
    const studentNitk = await User.create({
      name: 'Abhijith Student',
      email: 'abhijith@nitk.edu.in',
      role: 'student',
      studentType: 'nitk',
      irisVerified: true,
      verified: true,
      status: 'approved',
      profile: {
        college: 'NITK Surathkal',
        branch: 'Civil Engineering',
        year: 3,
        cgpa: 8.5,
        cgpaSource: 'iris_verified',
        skills: ['AutoCAD', 'Python', 'GIS', 'Excel'],
        resumeUrl: 'https://drive.google.com/file/d/sample-resume-id/view',
        phone: '+91 99999 88888',
        linkedin: 'https://linkedin.com/in/abhijith-student',
        github: 'https://github.com/abhijith-student'
      }
    });

    // 8. Seed Student (External Student - Verified)
    const studentExternal = await User.create({
      name: 'Rohan Student',
      email: 'rohan@external.com',
      role: 'student',
      studentType: 'external',
      irisVerified: false,
      verified: true,
      status: 'approved',
      passwordHash: 'password123',
      profile: {
        college: 'IIT Bombay',
        branch: 'Civil Engineering',
        year: 4,
        cgpa: 9.1,
        cgpaSource: 'self_reported',
        skills: ['Concrete Design', 'MATLAB', 'SAP2000'],
        resumeUrl: 'https://drive.google.com/file/d/rohan-resume-id/view',
        phone: '+91 88888 77777',
        linkedin: 'https://linkedin.com/in/rohan-external',
        github: 'https://github.com/rohan-external'
      }
    });
    console.log('[SEED] Students created.');

    // 9. Seed active open proposal
    const internship1 = await Internship.create({
      title: 'Concrete Structural Health Analytics',
      description: 'Perform sensor-data collection and machine learning classification of concrete micro-fissures on structural spans. Ideal for candidates with basic python knowledge.',
      professorId: profRamesh._id,
      eligibility: {
        branches: ['Civil Engineering'],
        minCGPA: 7.5
      },
      scope: 'open',
      stipend: '₹12,000 / month',
      duration: '2 Months',
      openings: 3,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days future
      status: 'open',
      customFields: [
        {
          fieldId: 'cf-q1',
          label: 'Have you taken the Structural Dynamics core course?',
          type: 'select',
          options: ['Yes', 'No', 'Currently Enrolled'],
          required: true
        },
        {
          fieldId: 'cf-q2',
          label: 'Link to your GitHub profile or project portfolio',
          type: 'link',
          required: false
        }
      ]
    });

    // 10. Seed internal open proposal
    const internship2 = await Internship.create({
      title: 'GIS Mapping & Runoff Inundation Modeling',
      description: 'Model stormwater runoff dispersion contours around the NITK surathkal highway bypass corridors using QGIS datasets.',
      professorId: profRamesh._id,
      eligibility: {
        branches: ['Civil Engineering', 'Mining Engineering'],
        minCGPA: 8.0
      },
      scope: 'nitk_only',
      stipend: '₹8,000 / month',
      duration: '3 Months',
      openings: 2,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days future
      status: 'open',
      customFields: []
    });

    // 11. Seed closed expired proposal
    const internship3 = await Internship.create({
      title: 'Geotechnical Stress Modeling (Expired)',
      description: 'Perform geotechnical stress simulations using PLAXIS 3D for underground mining tunnel spans.',
      professorId: profRamesh._id,
      eligibility: {
        branches: ['Mining Engineering'],
        minCGPA: 7.0
      },
      scope: 'specific_colleges',
      specificColleges: ['NITK Surathkal', 'IIT Bombay'],
      stipend: 'Unpaid',
      duration: '1 Month',
      openings: 1,
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days past
      status: 'closed',
      customFields: []
    });

    console.log('[SEED] Internship proposals seeded.');

    // 12. Seed mock audit logs
    await AuditLog.create([
      {
        actorId: superAdmin._id,
        action: 'ADD_FACULTY_ENTRY',
        targetType: 'FacultyList',
        targetId: faculty1._id,
        metadata: { email: 'ramesh@nitk.edu.in' },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        actorId: superAdmin._id,
        action: 'ADD_FACULTY_ENTRY',
        targetType: 'FacultyList',
        targetId: faculty2._id,
        metadata: { email: 'suresh@nitk.edu.in' },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        actorId: profRamesh._id,
        action: 'CREATE_INTERNSHIP',
        targetType: 'Internship',
        targetId: internship1._id,
        metadata: { title: internship1.title, plateId: internship1.plateId },
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('[SEED] Initial audit log entries created.');
    console.log('[SEED] Database seeding completed successfully! Close script.');
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[SEED] Fatal seeding error: ${error.message}`);
    console.error(error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
