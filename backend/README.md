# PACE Backend — Phase 1 Foundation

This is the backend API for **PACE**, an internship portal for the Civil Engineering department at NITK.

This foundation includes project setup, MongoDB database models, role-based access control (RBAC), authentication flows (including Sign-in with IRIS for NITK verification), professor onboarding, and auditing.

---

## 1. Project Directory Structure

The project maintains a clean separation of concerns as follows:
```text
backend/
├── config/             # Database connectivity & environment configuration
├── controllers/        # Express route controllers/handlers
├── jobs/               # Placeholder for future cron and queue tasks
├── middleware/         # Custom Express middlewares (auth, logging, error handling)
├── models/             # Mongoose schemas & database models
├── routes/             # Express routes grouped by resource
├── scripts/            # Database seeding scripts
├── services/           # External service clients (e.g. IRIS OAuth client)
└── tests/              # Jest integration tests
```

---

## 2. Setup & Environment Variables

### Requirements
- **Node.js** (v18+)
- **npm** (v9+)
- **MongoDB** (Running locally, or via Docker)

### Step 1: Start MongoDB
You can start a local MongoDB instance in the background using the root `docker-compose.yml` file:
```bash
docker-compose up -d db
```
This runs MongoDB on standard port `27017` mapping to your local host.

### Step 2: Configure Environment
Copy `.env.development` or create a new `.env.production` file in the `backend/` folder (never commit `.env.production`):

```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/pace
JWT_ACCESS_SECRET=dev_access_secret_key_12345
JWT_REFRESH_SECRET=dev_refresh_secret_key_12345
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# IRIS OAuth Details
IRIS_CLIENT_ID=mock_client_id
IRIS_CLIENT_SECRET=mock_client_secret
IRIS_CALLBACK_URL=http://localhost:5000/auth/iris/callback
IRIS_AUTHORIZATION_URL=https://iris.nitk.ac.in/oauth/authorize
IRIS_TOKEN_URL=https://iris.nitk.ac.in/oauth/token
IRIS_PROFILE_URL=https://iris.nitk.ac.in/api/v1/profile

# Seeding Variables
SUPER_ADMIN_EMAIL=superadmin@nitk.edu.in
SUPER_ADMIN_NAME=Super Admin
```

### Step 3: Install Dependencies
Run from the `backend/` directory:
```bash
npm install
```

---

## 3. Seed Scripts

Seeding scripts populate the initial system setup. Run them in order:

### 1. Seed the Super Admin
Creates the primary administrator account using the `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_NAME` environment variables.
```bash
node scripts/seedSuperAdmin.js
```
- **Default password generated:** `Admin@123` (Change this upon login).

### 2. Seed Faculty List
Seeds the pre-approved department faculty list. This lists professors authorized to use the platform. Note: *Run the Super Admin seed script first, as the faculty list records reference the creator.*
```bash
node scripts/seedFacultyList.js
```

---

## 4. Running the Application & Tests

### Start the Development Server
```bash
npm run dev
```
The server will run on `http://localhost:5000`. You can hit `http://localhost:5000/health` to confirm it is up.

### Run Integration Tests
We use Jest and Supertest to execute complete integration tests covering registration, login, IRIS authentication logic, role upgrades, ownership constraints, eligibility validations, token rotations, and edge cases.
```bash
npm test
```

---

## 5. API Endpoint Documentation & Manual Verification Guide

Use an API client like Postman or Insomnia to verify endpoints manually. Ensure MongoDB is running and seed scripts are executed.

### Auth Endpoints (`/auth`)

#### 1. Sign in with IRIS (NITK Students / Faculty)
- **Step A:** `GET /auth/iris/login`
  - Redirects to the IRIS Authorization URL with generated `state` query parameters.
- **Step B:** `GET /auth/iris/callback?code=AUTH_CODE&state=STATE_VALUE`
  - Verifies the state matches the `oauth_state` cookie for CSRF safety.
  - Exchanges code for token and fetches the profile.
  - Creates the user in Mongoose or matches existing. External students upgrading to NITK will have their account upgraded automatically and an audit log generated.
  - Returns `success: true`, `accessToken` and sets `refreshToken` inside a secure `httpOnly` cookie.

#### 2. External Student Signup
- **Request:** `POST /auth/signup`
- **Body:**
  ```json
  {
    "name": "Jane Student",
    "email": "jane@example.com",
    "password": "password123",
    "profile": {
      "college": "RV College of Engineering",
      "branch": "Civil Engineering",
      "year": 3,
      "cgpa": 8.7
    }
  }
  ```
- **Response:** `201 Created` with JWT access token. User profile is immediately active (`verified: true`).

#### 3. Professor Email Signup (Fallback Route)
- **Request:** `POST /auth/professor/signup`
- **Body:**
  ```json
  {
    "name": "Prof. Charles",
    "email": "charles@nitk.edu.in",
    "password": "password123",
    "department": "Civil Engineering"
  }
  ```
- **Constraints:** Email domain must match `@nitk.edu.in` or `@nitk.ac.in`.
- **Response:** `201 Created`. Account status is set to `pending` and `verified` to `false` until approved by an Admin/Super Admin.

#### 4. Email/Password Login
- **Request:** `POST /auth/login`
- **Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "password123"
  }
  ```
- **Response:** `200 OK`. Returns `accessToken` and sets `refreshToken` in cookie.

#### 5. Token Refresh
- **Request:** `POST /auth/refresh`
- **Details:** Automatically grabs the `refreshToken` from the secure cookie and returns a fresh, short-lived `accessToken`.

#### 6. Logout
- **Request:** `POST /auth/logout`
- **Details:** Clears the `refreshToken` cookie and invalidates the session.

---

### Admin Endpoints (`/admin`)
*Requires `Authorization: Bearer <ADMIN_OR_SUPERADMIN_JWT_TOKEN>`*

#### 1. Fetch Pending Professors
- **Request:** `GET /admin/professors/pending`
- **Access:** Admin or Super Admin
- **Response:** Lists all registered professors who are currently `pending`.

#### 2. Approve Professor
- **Request:** `PATCH /admin/professors/:id/approve`
- **Access:** Admin or Super Admin
- **Validation:** Will look up the professor's email inside the pre-approved `FacultyList`. Rejects approval if they are not listed.
- **Response:** `200 OK`. Sets `verified: true` and `status: 'approved'`.

#### 3. Reject Professor
- **Request:** `PATCH /admin/professors/:id/reject`
- **Access:** Admin or Super Admin
- **Body:** `{"reason": "Email domain mismatch / unrecognized staff"}`
- **Response:** `200 OK`. Sets `status: 'rejected'`.

#### 4. Add Professor to Pre-approved Faculty List
- **Request:** `POST /admin/faculty`
- **Access:** Super Admin only (bypasses standard Admins)
- **Body:**
  ```json
  {
    "name": "Prof. Charles",
    "email": "charles@nitk.edu.in",
    "department": "Civil Engineering"
  }
  ```
- **Response:** `201 Created`. Inserts professor details into the pre-approved FacultyList.

---

### Internship Endpoints (`/internships`)
*Requires `Authorization: Bearer <JWT_TOKEN>`*

#### 1. Create Internship Listing
- **Request:** `POST /internships`
- **Access:** Approved Professors (`status: 'approved'`)
- **Body:**
  ```json
  {
    "title": "Structural Dynamics Analysis",
    "description": "Research on load impacts on concrete structures.",
    "scope": "nitk_only",
    "eligibility": {
      "branches": ["Civil Engineering"],
      "minCGPA": 8.0,
      "years": [3, 4]
    },
    "stipend": "₹10,000 / Month",
    "duration": "3 Months",
    "deadline": "2026-12-31T23:59:59.000Z",
    "openings": 2
  }
  ```
- **Response:** `201 Created`. Auto-generates `plateId` sequentially (e.g. `PACE-001`).

#### 2. List All Internships
- **Request:** `GET /internships`
- **Access:** All roles.

#### 3. Update Internship
- **Request:** `PATCH /internships/:id`
- **Access:** Owner (the Professor who created it) or Admin/Super Admin (who bypass ownership limits).
- **Details:** Protects `plateId` and `professorId` fields from modification.

#### 4. Apply to Internship
- **Request:** `POST /internships/:id/apply`
- **Access:** Students
- **Body:** `{"coverNote": "Interested in concrete structures research!"}`
- **Eligibility Checks Run Before Creating Application:**
  - Prevents application if internship is `closed`.
  - Blocks duplicate applications from the same student.
  - Requires student to have uploaded a `resumeUrl` in profile.
  - Scope: Checks if student satisfies `scope` limits (`open`, `nitk_only`, or `specific_colleges`).
  - CGPA: Validates student CGPA against listing `minCGPA`.
  - Academic Branch/Year: Validates student's branch and year against allowed arrays.

#### 5. List Applications for Internship Listing
- **Request:** `GET /internships/:id/applications`
- **Access:** Owner (Professor) or Admin/Super Admin.
- **Response:** Lists student info, snapshots of resumes, cover notes, and submission times.

---

### Application Endpoints (`/applications`)
*Requires `Authorization: Bearer <JWT_TOKEN>`*

#### 1. Update Application Status
- **Request:** `PATCH /applications/:id`
- **Access:** Owner (Professor of the listing) or Admin/Super Admin
- **Body:** `{"status": "shortlisted"}` (Allowed values: `shortlisted`, `rejected`, `selected`, `withdrawn`)
- **Response:** `200 OK`. Updates status and creates corresponding `AuditLog` entry.

---

## 6. Audit Logging Actions

The backend registers detailed auditing entries for safety, logging:
- `CREATE_USER_IRIS`, `CREATE_USER_EXTERNAL`
- `UPGRADE_EXTERNAL_TO_NITK`
- `CREATE_PROFESSOR_PENDING`, `APPROVE_PROFESSOR`, `REJECT_PROFESSOR`
- `ADD_FACULTY`
- `CREATE_INTERNSHIP`, `UPDATE_INTERNSHIP`
- `APPLY_INTERNSHIP`, `UPDATE_APPLICATION_STATUS`
