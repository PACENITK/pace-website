const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const FacultyList = require('../models/FacultyList');
const AuditLog = require('../models/AuditLog');
const Counter = require('../models/Counter');
const SystemConfig = require('../models/SystemConfig');
const { clearMaintenanceCache } = require('../middleware/maintenance');
const irisService = require('../services/irisService');

// Define connection URI for tests
const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/pace_test';

beforeAll(async () => {
  // Override environment configuration for safety
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test_access_secret_key';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clear collections before each test to guarantee isolation
  await User.deleteMany({});
  await Internship.deleteMany({});
  await Application.deleteMany({});
  await FacultyList.deleteMany({});
  await AuditLog.deleteMany({});
  await Counter.deleteMany({});
  await SystemConfig.deleteMany({});
  clearMaintenanceCache();
});

describe('PACE Backend Integration Tests', () => {
  
  // ==========================================
  // 1. External Student Signup & Login Flow
  // ==========================================
  describe('External Student Auth Flow', () => {
    it('should register an external student and return verified: true immediately', async () => {
      const signupData = {
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        password: 'password123',
        profile: {
          college: 'RV College of Engineering',
          branch: 'Civil Engineering',
          year: 3,
          cgpa: 8.5
        }
      };

      const res = await request(app)
        .post('/auth/signup')
        .send(signupData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('student');
      expect(res.body.user.studentType).toBe('external');
      expect(res.body.user.verified).toBe(true);
      expect(res.body.user.irisVerified).toBe(false);
      expect(res.body.user.passwordHash).toBeUndefined(); // Should not return password

      // Verify user is in DB
      const userInDb = await User.findOne({ email: 'john.doe@gmail.com' });
      expect(userInDb).toBeTruthy();
      expect(userInDb.profile.cgpaSource).toBe('self_reported');
    });

    it('should allow external students to log in with password', async () => {
      // Create user
      await request(app)
        .post('/auth/signup')
        .send({
          name: 'Jane Doe',
          email: 'jane@gmail.com',
          password: 'password123'
        });

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'jane@gmail.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined(); // Refresh token cookie set
    });
  });

  // ==========================================
  // 2. Professor Signup & Moderation Flow
  // ==========================================
  describe('Professor Registration & Moderation', () => {
    it('should restrict professor email signup to NITK domains and set status to pending', async () => {
      const badSignup = {
        name: 'Prof. Alice',
        email: 'alice@gmail.com', // Non-NITK domain
        password: 'password123',
        department: 'Civil Engineering'
      };

      const badRes = await request(app)
        .post('/auth/professor/signup')
        .send(badSignup);

      expect(badRes.status).toBe(400);
      expect(badRes.body.success).toBe(false);

      const goodSignup = {
        name: 'Prof. Alice',
        email: 'alice@nitk.edu.in', // Correct domain
        password: 'password123',
        department: 'Civil Engineering'
      };

      const res = await request(app)
        .post('/auth/professor/signup')
        .send(goodSignup);

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('professor');
      expect(res.body.user.verified).toBe(false);
      expect(res.body.user.status).toBe('pending');

      // Check Audit Log
      const audit = await AuditLog.findOne({ action: 'CREATE_PROFESSOR_PENDING' });
      expect(audit).toBeTruthy();
    });

    it('should prevent pending professors from posting internships', async () => {
      // 1. Create a pending professor
      await request(app)
        .post('/auth/professor/signup')
        .send({
          name: 'Prof. Bob',
          email: 'bob@nitk.ac.in',
          password: 'password123',
          department: 'Civil Engineering'
        });

      // Log in to get accessToken
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'bob@nitk.ac.in',
          password: 'password123'
        });
      const token = loginRes.body.accessToken;

      // 2. Attempt to create internship
      const internshipData = {
        title: 'Concrete Technology Research',
        description: 'Deep dive research into self-healing concrete.',
        scope: 'open',
        eligibility: { branches: ['Civil Engineering'], minCGPA: 7.0, years: [3] },
        duration: '2 Months',
        deadline: new Date(Date.now() + 864000000).toISOString(),
        openings: 2
      };

      const res = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${token}`)
        .send(internshipData);

      expect(res.status).toBe(403); // Forbidden
      expect(res.body.message).toContain('pending admin approval');
    });

    it('should allow admin to approve professor if email in FacultyList', async () => {
      // 1. Setup seed users
      // Setup Super Admin
      const superAdmin = await User.create({
        role: 'super_admin',
        name: 'Super Admin',
        email: 'super@nitk.edu.in',
        passwordHash: 'admin123',
        verified: true,
        status: 'approved'
      });

      // Login super admin to get token
      const saLogin = await request(app)
        .post('/auth/login')
        .send({ email: 'super@nitk.edu.in', password: 'admin123' });
      const saToken = saLogin.body.accessToken;

      // 2. Register Professor Bob (pending)
      const profBob = await User.create({
        role: 'professor',
        name: 'Prof. Bob',
        email: 'bob@nitk.ac.in',
        verified: false,
        status: 'pending'
      });

      // 3. Admin attempts approval (should fail because Bob is not on FacultyList)
      const failApprove = await request(app)
        .patch(`/admin/professors/${profBob._id}/approve`)
        .set('Authorization', `Bearer ${saToken}`);

      expect(failApprove.status).toBe(400);
      expect(failApprove.body.message).toContain('not present in the pre-approved Faculty List');

      // 4. Super Admin adds Bob to FacultyList
      const addFacultyRes = await request(app)
        .post('/admin/faculty')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          name: 'Prof. Bob',
          email: 'bob@nitk.ac.in',
          department: 'Civil Engineering'
        });
      expect(addFacultyRes.status).toBe(201);

      // 5. Admin approves Bob (should succeed now)
      const approveRes = await request(app)
        .patch(`/admin/professors/${profBob._id}/approve`)
        .set('Authorization', `Bearer ${saToken}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('approved');
      expect(approveRes.body.data.verified).toBe(true);

      // Verify Professor can now log in and post
      const profLogin = await User.findById(profBob._id);
      profLogin.passwordHash = 'password123'; // Assign password to test
      await profLogin.save();

      const pLoginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'bob@nitk.ac.in', password: 'password123' });
      const pToken = pLoginRes.body.accessToken;

      const internshipRes = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${pToken}`)
        .send({
          title: 'Concrete Research',
          description: 'Self healing concrete.',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 7.0 },
          duration: '2 Months',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 2
        });

      expect(internshipRes.status).toBe(201);
      expect(internshipRes.body.data.plateId).toBe('PACE-001'); // Auto-generated sequentials
    });
  });

  // ==========================================
  // 3. IRIS Authentication & Upgrades
  // ==========================================
  describe('Sign in with IRIS (OAuth callback mock)', () => {
    it('should create a verified student on IRIS callback', async () => {
      // Spy on iris service methods
      const mockToken = 'mock_access_token_123';
      const mockProfile = {
        name: 'Iris Student',
        email: 'iris_stu@nitk.edu.in',
        rollNumber: '21CO145'
      };

      jest.spyOn(irisService, 'exchangeCodeForToken').mockResolvedValue(mockToken);
      jest.spyOn(irisService, 'getProfile').mockResolvedValue(mockProfile);

      // Callback request with matching state cookie
      const res = await request(app)
        .get('/auth/iris/callback')
        .set('Cookie', 'oauth_state=test_state')
        .query({ code: 'oauth_code', state: 'test_state' });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('student');
      expect(res.body.user.studentType).toBe('nitk');
      expect(res.body.user.irisVerified).toBe(true);
      expect(res.body.user.rollNumber).toBe('21CO145');

      const userInDb = await User.findOne({ email: 'iris_stu@nitk.edu.in' });
      expect(userInDb.profile.cgpaSource).toBe('iris_verified');
    });

    it('should upgrade existing external student to nitk student if same email signs in via IRIS', async () => {
      // 1. Create external student in DB
      const externalStudent = await User.create({
        role: 'student',
        studentType: 'external',
        name: 'Iris Student',
        email: 'iris_stu@nitk.edu.in',
        irisVerified: false,
        verified: true,
        profile: {
          college: 'External College',
          cgpaSource: 'self_reported'
        }
      });

      // 2. Setup mock profile return
      const mockToken = 'mock_access_token_456';
      const mockProfile = {
        name: 'Iris Student upgraded',
        email: 'iris_stu@nitk.edu.in',
        rollNumber: '21CO145'
      };

      jest.spyOn(irisService, 'exchangeCodeForToken').mockResolvedValue(mockToken);
      jest.spyOn(irisService, 'getProfile').mockResolvedValue(mockProfile);

      // 3. Callback trigger
      const res = await request(app)
        .get('/auth/iris/callback')
        .set('Cookie', 'oauth_state=test_state')
        .query({ code: 'oauth_code', state: 'test_state' });

      expect(res.status).toBe(200); // 200 for existing user upgrade/login
      expect(res.body.user.studentType).toBe('nitk');
      expect(res.body.user.irisVerified).toBe(true);
      expect(res.body.user.rollNumber).toBe('21CO145');

      // Verify DB updates
      const updatedUser = await User.findById(externalStudent._id);
      expect(updatedUser.studentType).toBe('nitk');
      expect(updatedUser.irisVerified).toBe(true);
      
      const upgradeAudit = await AuditLog.findOne({ action: 'UPGRADE_EXTERNAL_TO_NITK' });
      expect(upgradeAudit).toBeTruthy();
    });
  });

  // ==========================================
  // 4. Role & Ownership Restrictions
  // ==========================================
  describe('Permissions & Ownership Enforcement', () => {
    let prof1Token, prof2Token, adminToken, studentToken;
    let internshipId;

    beforeEach(async () => {
      // Create professors
      const prof1 = await User.create({
        role: 'professor',
        name: 'Prof. One',
        email: 'prof1@nitk.edu.in',
        passwordHash: 'pass',
        status: 'approved',
        verified: true
      });
      const prof2 = await User.create({
        role: 'professor',
        name: 'Prof. Two',
        email: 'prof2@nitk.edu.in',
        passwordHash: 'pass',
        status: 'approved',
        verified: true
      });

      // Create Admin
      const admin = await User.create({
        role: 'admin',
        name: 'Admin User',
        email: 'admin@nitk.edu.in',
        passwordHash: 'pass',
        verified: true
      });

      // Create Student
      const student = await User.create({
        role: 'student',
        studentType: 'nitk',
        name: 'Student',
        email: 'student@nitk.edu.in',
        passwordHash: 'pass',
        verified: true,
        profile: {
          resumeUrl: 'https://cdn.pace.nitk.ac.in/resumes/std1.pdf',
          cgpa: 9.0,
          branch: 'Civil Engineering',
          year: 3
        }
      });

      // Logins
      const loginP1 = await request(app).post('/auth/login').send({ email: 'prof1@nitk.edu.in', password: 'pass' });
      prof1Token = loginP1.body.accessToken;

      const loginP2 = await request(app).post('/auth/login').send({ email: 'prof2@nitk.edu.in', password: 'pass' });
      prof2Token = loginP2.body.accessToken;

      const loginAdm = await request(app).post('/auth/login').send({ email: 'admin@nitk.edu.in', password: 'pass' });
      adminToken = loginAdm.body.accessToken;

      const loginStu = await request(app).post('/auth/login').send({ email: 'student@nitk.edu.in', password: 'pass' });
      studentToken = loginStu.body.accessToken;

      // Prof 1 creates Internship
      const intRes = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({
          title: 'Structural Dynamics Project',
          description: 'Analyse load impacts on bridges.',
          scope: 'nitk_only',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 8.0, years: [3] },
          duration: '3 Months',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1
        });
      internshipId = intRes.body.data._id;
    });

    it('should block non-owners from editing an internship', async () => {
      // Prof 2 attempts update on Prof 1's internship
      const updateRes = await request(app)
        .patch(`/internships/${internshipId}`)
        .set('Authorization', `Bearer ${prof2Token}`)
        .send({ title: 'Hacked Title' });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.message).toContain('do not have ownership');

      // Verify unchanged in DB
      const intDb = await Internship.findById(internshipId);
      expect(intDb.title).toBe('Structural Dynamics Project');
    });

    it('should allow the owner to edit their own internship', async () => {
      const updateRes = await request(app)
        .patch(`/internships/${internshipId}`)
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({ title: 'New Structural Dynamics Project' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('New Structural Dynamics Project');
    });

    it('should allow Admins/Super Admins to bypass ownership and edit postings', async () => {
      const updateRes = await request(app)
        .patch(`/internships/${internshipId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Moderated Title' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('Admin Moderated Title');
    });

    it('should enforce student eligibility validations during application submission', async () => {
      // 1. Success case: student satisfies all criteria (CGPA 9.0, Civil Engineering branch, year 3, NITK student)
      const successRes = await request(app)
        .post(`/internships/${internshipId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ coverNote: 'I love structural engineering!' });

      expect(successRes.status).toBe(201);
      expect(successRes.body.success).toBe(true);

      // 2. Failure: Duplicate applications
      const dupRes = await request(app)
        .post(`/internships/${internshipId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(dupRes.status).toBe(400);

      // 3. Warning: CGPA restriction (Change student profile CGPA to 7.0, while minimum is 8.0)
      const lowCgpaStudent = await User.create({
        role: 'student',
        studentType: 'nitk',
        name: 'Low CGPA Student',
        email: 'lowcgpa@nitk.edu.in',
        passwordHash: 'pass',
        verified: true,
        profile: {
          resumeUrl: 'https://cdn.pace.nitk.ac.in/resumes/std2.pdf',
          cgpa: 7.0, // Low CGPA
          branch: 'Civil Engineering',
          year: 3
        }
      });
      const lowLogin = await request(app).post('/auth/login').send({ email: 'lowcgpa@nitk.edu.in', password: 'pass' });
      const lowToken = lowLogin.body.accessToken;

      const cgpaFailRes = await request(app)
        .post(`/internships/${internshipId}/apply`)
        .set('Authorization', `Bearer ${lowToken}`);
      expect(cgpaFailRes.status).toBe(201);
      expect(cgpaFailRes.body.eligibilityWarning).toBe(true);

      // 4. Warning: Branch restriction (Change student branch to Computer Science)
      const wrongBranchStudent = await User.create({
        role: 'student',
        studentType: 'nitk',
        name: 'CS Student',
        email: 'cs@nitk.edu.in',
        passwordHash: 'pass',
        verified: true,
        profile: {
          resumeUrl: 'https://cdn.pace.nitk.ac.in/resumes/std3.pdf',
          cgpa: 9.0,
          branch: 'Computer Science', // Wrong branch
          year: 3
        }
      });
      const wrongLogin = await request(app).post('/auth/login').send({ email: 'cs@nitk.edu.in', password: 'pass' });
      const wrongToken = wrongLogin.body.accessToken;

      const branchFailRes = await request(app)
        .post(`/internships/${internshipId}/apply`)
        .set('Authorization', `Bearer ${wrongToken}`);
      expect(branchFailRes.status).toBe(201);
      expect(branchFailRes.body.eligibilityWarning).toBe(true);
    });
  });

  // ==========================================
  // 5. Token Refresh & Logout Flow
  // ==========================================
  describe('Session Expiry, Refresh and Logout', () => {
    it('should refresh access tokens with valid cookies and terminate session on logout', async () => {
      // 1. Sign up student
      await request(app)
        .post('/auth/signup')
        .send({
          name: 'Session User',
          email: 'session@gmail.com',
          password: 'password123'
        });

      // 2. Login to get refreshToken cookie
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'session@gmail.com',
          password: 'password123'
        });

      const refreshCookie = loginRes.headers['set-cookie'][0];

      // 3. Make request to /auth/refresh with cookie
      const refreshRes = await request(app)
        .post('/auth/refresh')
        .set('Cookie', refreshCookie);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeDefined();

      // 4. Log out to clear session
      const logoutRes = await request(app)
        .post('/auth/logout');
      
      expect(logoutRes.status).toBe(200);
      // Verify cookie cleared in headers
      expect(logoutRes.headers['set-cookie'][0]).toContain('refreshToken=;');
    });
  });

  // ==========================================
  // 6. Negative Permission Rejection checks
  // ==========================================
  describe('Negative Permission checks', () => {
    it('should reject unauthenticated requests to secure routes', async () => {
      const res = await request(app)
        .get('/admin/professors/pending');
      expect(res.status).toBe(401);
    });

    it('should reject students attempting to view pending professor approvals', async () => {
      // Register student and login
      await User.create({
        role: 'student',
        studentType: 'external',
        name: 'Student Fail',
        email: 'stu_fail@gmail.com',
        passwordHash: 'pass',
        verified: true
      });
      const loginRes = await request(app).post('/auth/login').send({ email: 'stu_fail@gmail.com', password: 'pass' });
      const token = loginRes.body.accessToken;

      const res = await request(app)
        .get('/admin/professors/pending')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 7. Phase 2 Features (Custom Fields, Eligibility Warn, Transitions, Rate Limiter, Cron, compliance, maintenance)
  // ==========================================
  describe('Phase 2 Backend Features', () => {
    let studentToken, profToken, adminToken, saToken;
    let studentUser, profUser, adminUser, saUser;
    let internshipId;

    beforeEach(async () => {
      // Create Users
      studentUser = await User.create({
        role: 'student',
        studentType: 'nitk',
        name: 'Phase2 Student',
        email: 'p2student@nitk.edu.in',
        passwordHash: 'pass',
        verified: true,
        profile: { cgpa: 9.0, branch: 'Civil Engineering', year: 3, resumeUrl: 'https://drive.google.com/resume.pdf' }
      });

      profUser = await User.create({
        role: 'professor',
        name: 'Phase2 Prof',
        email: 'p2prof@nitk.edu.in',
        passwordHash: 'pass',
        status: 'approved',
        verified: true
      });

      adminUser = await User.create({
        role: 'admin',
        name: 'Phase2 Admin',
        email: 'p2admin@nitk.edu.in',
        passwordHash: 'pass',
        verified: true
      });

      saUser = await User.create({
        role: 'super_admin',
        name: 'Phase2 SuperAdmin',
        email: 'p2super@nitk.edu.in',
        passwordHash: 'pass',
        verified: true
      });

      // Get Tokens
      const loginStu = await request(app).post('/auth/login').send({ email: 'p2student@nitk.edu.in', password: 'pass' });
      studentToken = loginStu.body.accessToken;

      const loginProf = await request(app).post('/auth/login').send({ email: 'p2prof@nitk.edu.in', password: 'pass' });
      profToken = loginProf.body.accessToken;

      const loginAdmin = await request(app).post('/auth/login').send({ email: 'p2admin@nitk.edu.in', password: 'pass' });
      adminToken = loginAdmin.body.accessToken;

      const loginSA = await request(app).post('/auth/login').send({ email: 'p2super@nitk.edu.in', password: 'pass' });
      saToken = loginSA.body.accessToken;
    });

    it('should reject select custom field creation without options', async () => {
      const badInternship = {
        title: 'Select Field Test',
        description: 'Test select field validation',
        scope: 'open',
        eligibility: { branches: ['Civil Engineering'], minCGPA: 7.0 },
        duration: '2 Months',
        deadline: new Date(Date.now() + 864000000).toISOString(),
        openings: 1,
        customFields: [
          { label: 'Choose Option', type: 'select', options: [], required: true }
        ]
      };

      const res = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send(badInternship);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation Error');
    });

    it('should enforce append-only customFields update rules when applications exist', async () => {
      // 1. Professor creates internship with one custom field
      const intRes = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          title: 'Append Only Test',
          description: 'Testing customFields editing rules',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 7.0 },
          duration: '2 Months',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1,
          customFields: [
            { label: 'Field 1', type: 'text', required: true }
          ]
        });

      const intId = intRes.body.data._id;
      const originalFieldId = intRes.body.data.customFields[0].fieldId;

      // 2. Student applies to it
      await request(app)
        .post(`/internships/${intId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          coverNote: 'Applied',
          responses: [{ fieldId: originalFieldId, value: 'Answer 1' }]
        });

      // 3. Prof attempts to remove the field (should fail)
      const removeRes = await request(app)
        .patch(`/internships/${intId}`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          customFields: []
        });
      expect(removeRes.status).toBe(400);
      expect(removeRes.body.message).toContain('cannot be removed');

      // 4. Prof attempts to change field type (should fail)
      const typeRes = await request(app)
        .patch(`/internships/${intId}`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          customFields: [{ fieldId: originalFieldId, label: 'Field 1', type: 'number', required: true }]
        });
      expect(typeRes.status).toBe(400);
      expect(typeRes.body.message).toContain('cannot be changed');

      // 5. Prof attempts to add a new REQUIRED field (should fail)
      const requiredRes = await request(app)
        .patch(`/internships/${intId}`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          customFields: [
            { fieldId: originalFieldId, label: 'Field 1', type: 'text', required: true },
            { label: 'New Required', type: 'text', required: true }
          ]
        });
      expect(requiredRes.status).toBe(400);
      expect(requiredRes.body.message).toContain('must be optional');

      // 6. Prof appends a new optional field (should succeed)
      const okRes = await request(app)
        .patch(`/internships/${intId}`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          customFields: [
            { fieldId: originalFieldId, label: 'Field 1', type: 'text', required: true },
            { label: 'New Optional', type: 'text', required: false }
          ]
        });
      expect(okRes.status).toBe(200);
      expect(okRes.body.data.customFields.length).toBe(2);
    });

    it('should reject application with missing required custom field or invalid select option', async () => {
      // Create student2 for this specific test to avoid rate limiting
      const student2 = await User.create({
        role: 'student',
        studentType: 'nitk',
        name: 'Phase2 Student 2',
        email: 'p2student2@nitk.edu.in',
        passwordHash: 'pass',
        verified: true,
        profile: { cgpa: 9.0, branch: 'Civil Engineering', year: 3, resumeUrl: 'https://drive.google.com/resume.pdf' }
      });
      const loginStu2 = await request(app).post('/auth/login').send({ email: 'p2student2@nitk.edu.in', password: 'pass' });
      const studentToken2 = loginStu2.body.accessToken;

      // 1. Create internship with required select field
      const intRes = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          title: 'Custom Field Match Test',
          description: 'Testing validation on answers',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 7.0 },
          duration: '2 Months',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1,
          customFields: [
            { label: 'City', type: 'select', options: ['Mangalore', 'Bangalore'], required: true }
          ]
        });

      const intId = intRes.body.data._id;
      const fieldId = intRes.body.data.customFields[0].fieldId;

      // 2. Apply with missing responses (should fail) — using studentToken (1st req)
      const missingRes = await request(app)
        .post(`/internships/${intId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ coverNote: 'Missing answers' });
      expect(missingRes.status).toBe(400);
      expect(missingRes.body.message).toContain('required');

      // 3. Apply with invalid select option (should fail) — using studentToken2 (1st req)
      const invalidOptRes = await request(app)
        .post(`/internships/${intId}/apply`)
        .set('Authorization', `Bearer ${studentToken2}`)
        .send({
          coverNote: 'Bad select option',
          responses: [{ fieldId, value: 'Mysore' }]
        });
      expect(invalidOptRes.status).toBe(400);
      expect(invalidOptRes.body.message).toContain('must be one of the pre-defined options');

      // 4. Apply with correct responses (should succeed) — using studentToken2 (2nd req)
      const goodRes = await request(app)
        .post(`/internships/${intId}/apply`)
        .set('Authorization', `Bearer ${studentToken2}`)
        .send({
          coverNote: 'Perfect answers',
          responses: [{ fieldId, value: 'Bangalore' }]
        });
      expect(goodRes.status).toBe(201);
      expect(goodRes.body.success).toBe(true);
    });

    it('should allow student below eligibility criteria to apply with warning flag', async () => {
      // 1. Create restrictive internship (requires 9.5 CGPA)
      const intRes = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          title: 'High CGPA Internship',
          description: 'Required CGPA: 9.5',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 9.5 },
          duration: '2 Months',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1
        });
      const intId = intRes.body.data._id;

      // 2. Student (with 9.0 CGPA) applies (should succeed with warning)
      const applyRes = await request(app)
        .post(`/internships/${intId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ coverNote: 'I have 9.0 but want to try!' });

      expect(applyRes.status).toBe(201);
      expect(applyRes.body.eligibilityWarning).toBe(true);
      expect(applyRes.body.data.eligibilityWarning).toBe(true);

      // 3. Professor fetches applicants and sees warning flag
      const listRes = await request(app)
        .get(`/internships/${intId}/applicants`)
        .set('Authorization', `Bearer ${profToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data[0].eligibilityWarning).toBe(true);
    });

    it('should reject invalid status transitions', async () => {
      // 1. Create internship
      const intRes = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          title: 'Transition Test Listing',
          description: 'Testing status modifications',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 5.0 },
          duration: '1 Month',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1
        });
      const intId = intRes.body.data._id;

      // 2. Student applies
      const applyRes = await request(app)
        .post(`/internships/${intId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`);
      const appId = applyRes.body.data._id;

      // 3. Transition directly from applied to selected (should fail)
      const badRes1 = await request(app)
        .patch(`/applications/${appId}/status`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({ status: 'selected' });
      expect(badRes1.status).toBe(400);
      expect(badRes1.body.message).toContain('Invalid state transition');

      // 4. Transition from applied to shortlisted (should succeed)
      const okRes1 = await request(app)
        .patch(`/applications/${appId}/status`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({ status: 'shortlisted' });
      expect(okRes1.status).toBe(200);

      // 5. Transition from shortlisted to selected (should succeed)
      const okRes2 = await request(app)
        .patch(`/applications/${appId}/status`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({ status: 'selected' });
      expect(okRes2.status).toBe(200);

      // 6. Transition from selected to rejected (should fail - already in terminal state)
      const badRes2 = await request(app)
        .patch(`/applications/${appId}/status`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({ status: 'rejected' });
      expect(badRes2.status).toBe(400);
    });

    it('should prevent non-owning professor from viewing applicants', async () => {
      // 1. Create internship as Prof 1
      const intRes = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          title: 'Prof 1 Listing',
          description: 'Secret project',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 5.0 },
          duration: '1 Month',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1
        });
      const intId = intRes.body.data._id;

      // 2. Create another professor
      const anotherProf = await User.create({
        role: 'professor',
        name: 'Secret Prof',
        email: 'secretprof@nitk.edu.in',
        passwordHash: 'pass',
        status: 'approved',
        verified: true
      });
      const loginOther = await request(app).post('/auth/login').send({ email: 'secretprof@nitk.edu.in', password: 'pass' });
      const otherToken = loginOther.body.accessToken;

      // 3. Another professor attempts to view applicants (should fail)
      const res = await request(app)
        .get(`/internships/${intId}/applicants`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(403);
    });

    it('should reject malformed resumeUrl and accept well-formed URL', async () => {
      const intRes = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          title: 'Resume Check',
          description: 'Testing resumeUrl regex/validator',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 5.0 },
          duration: '1 Month',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1
        });
      const intId = intRes.body.data._id;

      // 1. Apply with malformed resumeUrl (should fail)
      const badRes = await request(app)
        .post(`/internships/${intId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'not_a_url' });
      expect(badRes.status).toBe(400);
      expect(badRes.body.message).toContain('resume URL is malformed');

      // 2. Apply with well-formed resumeUrl (should succeed)
      const goodRes = await request(app)
        .post(`/internships/${intId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'https://my-link.com/my-resume.pdf' });
      expect(goodRes.status).toBe(201);
      expect(goodRes.body.success).toBe(true);
    });

    it('should rate limit repeat applications', async () => {
      const intRes = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          title: 'Rate Limit Test Listing',
          description: 'Spam testing',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 5.0 },
          duration: '1 Month',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1
        });
      const intId = intRes.body.data._id;

      // First apply (succeeds)
      const res1 = await request(app)
        .post(`/internships/${intId}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'https://l.com/r.pdf' });
      expect(res1.status).toBe(201);

      // Create a second internship to apply again
      const intRes2 = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          title: 'Rate Limit Test Listing 2',
          description: 'Spam testing',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 5.0 },
          duration: '1 Month',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1
        });
      const intId2 = intRes2.body.data._id;

      // Second apply (succeeds, rate limit is 2 in test mode)
      const res2 = await request(app)
        .post(`/internships/${intId2}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'https://l.com/r.pdf' });
      expect(res2.status).toBe(201);

      // Create a third internship
      const intRes3 = await request(app)
        .post('/internships')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          title: 'Rate Limit Test Listing 3',
          description: 'Spam testing',
          scope: 'open',
          eligibility: { branches: ['Civil Engineering'], minCGPA: 5.0 },
          duration: '1 Month',
          deadline: new Date(Date.now() + 864000000).toISOString(),
          openings: 1
        });
      const intId3 = intRes3.body.data._id;

      // Third apply within same window (should fail with 429)
      const res3 = await request(app)
        .post(`/internships/${intId3}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'https://l.com/r.pdf' });
      expect(res3.status).toBe(429);
    });

    it('should auto-close expired internships in deadlineCloser job', async () => {
      const expiredInternship = await Internship.create({
        title: 'Past Internship',
        description: 'Expired long ago',
        professorId: profUser._id,
        eligibility: { branches: ['Civil Engineering'], minCGPA: 5.0 },
        scope: 'open',
        stipend: 'Unpaid',
        duration: '1 Month',
        deadline: new Date(Date.now() - 5000), // expired 5s ago
        openings: 1,
        status: 'open'
      });

      const { closeExpiredInternships } = require('../jobs/deadlineCloser');
      // Run the closer manually
      await closeExpiredInternships();

      const updated = await Internship.findById(expiredInternship._id);
      expect(updated.status).toBe('closed');
    });

    it('should aggregate admin analytics without exposing individual profile info', async () => {
      const res = await request(app)
        .get('/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.postingsCount).toBeDefined();
      expect(res.body.data.applicationsCount).toBeDefined();
      expect(res.body.data.dropOffRate).toBeDefined();
      // No sensitive array containing personal email or names
      expect(res.body.data.resumes).toBeUndefined();
      expect(res.body.data.emails).toBeUndefined();
    });

    it('should block non-Super Admins when maintenance mode is active', async () => {
      // 1. Super Admin toggles kill switch ON
      const toggleOn = await request(app)
        .post('/admin/kill-switch')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ active: true });
      expect(toggleOn.status).toBe(200);
      expect(toggleOn.body.maintenanceMode).toBe(true);

      // 2. Student attempts to load internships (should receive 503)
      const failRes = await request(app)
        .get('/internships')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(failRes.status).toBe(503);
      expect(failRes.body.message).toContain('maintenance mode');

      // 3. Super Admin attempts to load internships (should succeed)
      const okRes = await request(app)
        .get('/internships')
        .set('Authorization', `Bearer ${saToken}`);
      expect(okRes.status).toBe(200);

      // 4. Super Admin toggles kill switch OFF
      const toggleOff = await request(app)
        .post('/admin/kill-switch')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ active: false });
      expect(toggleOff.status).toBe(200);
      expect(toggleOff.body.maintenanceMode).toBe(false);

      // 5. Student attempts access again (should succeed now)
      const successRes = await request(app)
        .get('/internships')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(successRes.status).toBe(200);
    });
  });
});
