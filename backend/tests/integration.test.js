const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const FacultyList = require('../models/FacultyList');
const AuditLog = require('../models/AuditLog');
const Counter = require('../models/Counter');
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

      // 3. Failure: CGPA restriction (Change student profile CGPA to 7.0, while minimum is 8.0)
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
      expect(cgpaFailRes.status).toBe(403);
      expect(cgpaFailRes.body.message).toContain('does not meet the minimum requirement');

      // 4. Failure: Branch restriction (Change student branch to Computer Science)
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
      expect(branchFailRes.status).toBe(403);
      expect(branchFailRes.body.message).toContain('academic branch is not eligible');
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
        .get('/internships');
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
});
