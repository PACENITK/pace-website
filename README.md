# About Us

Welcome to the Professional Association for Civil Engineering (PACE) at NITK Surathkal.

PACE NITK is a student-driven club bridging academia and industry in civil engineering. We offer hands-on learning, industry exposure, and expert mentorship to equip students with real-world skills and innovation opportunities.

## Our Vision

To empower the next generation of civil engineers by bridging the gap between academia and industry, fostering innovation, and creating a collaborative platform for hands-on learning, research, and sustainable development.

---

# PACE Internship Portal — Comprehensive Guide

The **PACE Internship Portal** is a secure, role-based web platform designed to facilitate civil engineering internships by connecting student candidates with academic faculty, research supervisors, and administrators. 

This document provides a highly detailed guide explaining all user roles, onboarding validation checkpoints, application workflows, administrative configurations, and DPDP compliance procedures.

---

## 1. Portal Architecture Overview

The portal separates operations into clear administrative, moderation, faculty, and candidate segments, secured via structured JSON Web Token (JWT) session cookies. The platform features double-layered protection:
1. **Frontend Route Guards**: Restricts client-side page loads based on active session roles.
2. **Backend API Middleware**: Evaluates active roles, email verification status, profile approval status, and global maintenance states prior to database interactions.

---

## 2. Detailed Role-by-Role User Journeys

### A. The Guest (Visitor) Journey
Guests represent unauthenticated visitors landing on the platform.

```
[ Land on Homepage ] ──> [ View Open Listings (Limited) ]
                                 │
                                 ▼
                     [ Gate: View Detail/Apply ]
                                 │
                                 ▼ (Redirect)
                         [ Login Page ]
```

* **Onboarding & Entry**: 
  * The guest lands on the discovery page (`/portal`).
  * The frontend makes a public fetch to `/api/internships` to display listings.
* **Access Restraints**:
  * **Visible Data**: Guests see the internship title, duration, supervisor name, openings, deadline, and eligible academic branches.
  * **Hidden Data**: Specific stipend details, research descriptions, custom questionnaire prompts, and apply tools are hidden.
* **The Authorization Wall**:
  * If a guest clicks a listing, the page prompts them to register or sign in.
  * Attempting to access secure student dashboards redirects them automatically to the `/portal/login` page.

---

### B. The Student Journey (Candidate)
Students are divided into verified NITK students (auto-badged) and external institution students.

```
[ Signup Form ] ──> [ Email Verification Link ] ──> [ Log In ]
                                                           │
                                                           ▼
                                                [ Edit Profile & Links ]
                                                           │
                                                           ▼
                                                [ Apply to Internship ]
                                                (CGPA Checks & Warnings)
                                                           │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
       [ SHORTLISTED ]      [ SELECTED 🎉 ]       [ REJECTED ]
              │                                       │
              └───────────────────┬───────────────────┘
                                  ▼
                     [ Optional: DPDP Delete ]
```

* **Step 1: Registration**:
  * The student signs up using their name, email, and password.
  * **NITK Domain Mapping**: The system checks the signup email address. If the domain ends with `@nitk.edu.in` or `@nitk.ac.in`, the system automatically assigns `studentType: 'nitk'`, locks their college to `NITK Surathkal`, and marks their `cgpaSource` as `iris_verified`.
  * **External Mapping**: If the email domain does not match NITK, they are registered as `studentType: 'external'`, allowing them to enter their own college name, with `cgpaSource` set to `self_reported`.
* **Step 2: Email Verification Guard**:
  * Upon submission, the backend generates a secure `verificationToken` and sends an activation link to the student's email.
  * The account is marked `verified: false`. Any login attempt before clicking the email verification link returns a `403 Forbidden` response.
  * Once the verification link is visited (`/auth/verify?token=TOKEN`), the token is cleared, and `verified` becomes `true`.
* **Step 3: Profile Setup**:
  * The student logs in and updates their profile details at `/portal/profile`.
  * They select their current academic year, branch, and CGPA.
  * They enter external reference URLs: LinkedIn profile link, GitHub profile link, and their Resume PDF link (hosted on Google Drive or another storage platform).
  * **Input Validation**: The backend validates link inputs using strict regular expression guards to prevent malformed or malicious URLs.
* **Step 4: Internship Applications**:
  * The student selects an active internship.
  * **Eligibility Checks**: If the student's branch is not listed in the internship's eligible branches, or if their CGPA falls below the required threshold, they can still submit their application. However, a warning flag is attached to their application warning the reviewing professor that the candidate does not meet the eligibility parameters.
  * **Custom Questions**: The student fills in answers to any custom questions defined by the professor (e.g., "Describe your experience with AutoCAD").
  * **Rate Limiting**: To prevent script-spamming, the system limits students to one application submission per internship listing.
* **Step 5: Review Notifications**:
  * The student tracks status changes (Pending, Shortlisted, Selected, Rejected) on their dashboard.
  * Every status transition triggers an automated email notification detailing the supervisor's feedback.

---

### C. The Professor Journey (Faculty Supervisor)
Professors are registered faculty members who create proposals and manage candidates.

```
[ Signup Form + Proof ] ──> [ Email Verify ] ──> [ Admin Review Queue ]
                                                           │
                                                           ▼ (Manual Approve)
                                                   [ Log In & Post ]
                                                           │
                                                           ▼
                                                [ Manage Applicant list ]
                                                (Shortlist, Select, Reject)
```

* **Step 1: Multi-Institution Registration**:
  * A professor signs up by providing their name, email, password, active department, institution name (e.g. `IIT Bombay`), and a written or URL link representing their proof of status (e.g. university directory link).
  * A verification link is sent to their registered email address.
* **Step 2: The Administration Gate**:
  * The email verification link only confirms the address. The account remains in a `pending` status.
  * If the professor attempts to log in, they can access their basic dashboard but are blocked from posting new listings or viewing candidate profiles until an admin reviews and approves their account.
* **Step 3: Creation of Internship Listings**:
  * Once approved, the professor gains access to the proposal creation suite.
  * They define the internship's parameters: title, research scope, stipend details, duration, openings, branch requirements, minimum CGPA, and custom questions.
  * The system assigns a sequential plate ID (e.g., `PACE-001`) to the published listing.
* **Step 4: Candidate Selection & Shortlisting**:
  * The professor views the student application pipeline for their listings.
  * They can filter candidates, download resumes, and read responses to custom questions.
  * They update candidate statuses, which automatically triggers email updates to the students.
* **Step 5: Listing Closure**:
  * When selection completes, or the deadline passes, the listing is marked as `closed`.
  * The system automatically dispatches notifications to all remaining pending applicants informing them that the listing is closed.

---

### D. The Moderator/Admin Journey
Admins handle day-to-day moderation and approvals.

```
[ View Approvals Queue ] ──> [ Inspect Proof Links ] ──> [ Approve / Reject ]
                                                                 │
                                                                 ▼
                                                        [ Audit Logs View ]
```

* **Onboarding Moderation**:
  * Admins review the pending professor queue at `/portal/admin`.
  * They inspect the submitted institution, department, and proof of status.
  * **Manual Approvals**: Admins can approve any professor directly (manual override) or verify them against a pre-approved `FacultyList` table.
* **Listings Maintenance**:
  * Admins can inspect active internship listings and take down spam or inappropriate proposals.
  * They can access general platform analytics to monitor application activity.

---

### E. The Super Admin Journey (Compliance & Security)
Super Admins hold root access to configuration tables, compliance queues, and system switches.

```
┌─────────────────────────────────┼─────────────────────────────────┐
▼                                 ▼                                 ▼
[ DPDP Deletion Queue ]    [ Maintenance Switch ]          [ User Role Config ]
(Permanent Wipe)           (Activate/Deactivate)           (Promote / Demote)
```

* **DPDP Compliance Data Wiping**:
  * When a student requests account deletion, they are placed in the Super Admin's Deletion Queue.
  * The Super Admin reviews the request and clicks **"Confirm Wipe & Delete"**.
  * The backend executes a cascading database purge: it deletes the user document, clears all active login sessions, and wipes all internship applications submitted by that user.
* **Platform Maintenance (Kill Switch)**:
  * Super Admins can toggle global maintenance mode from their dashboard.
  * Activating maintenance mode intercepts all inbound requests at the gateway level, returning a `503 Service Unavailable` response to all students, guests, and professors, while keeping the database accessible to Super Admins.
* **Role Modifications**:
  * Super Admins can promote regular users to Moderator/Admin roles or demote them back to standard access.

---

## 3. Platform State Machines

### A. User Verification State Machine
```
[ Signup ] ──> [ Status: unverified ] ──( Click Link )──> [ Status: verified ]
                                                                 │
  ┌──────────────────────────────────────────────────────────────┘
  ▼
[ Student Role ] ─────────────────────────> [ Access Granted ]
[ Professor Role ] ──> [ Status: pending ] ──( Admin Review )──> [ Approved ]
```

### B. Internship Application Lifecycle
```
[ Submitted ] ──> [ Status: PENDING ]
                        │
       ┌────────────────┴────────────────┬────────────────┐
       ▼                                 ▼                ▼
[ SHORTLISTED ]                   [ SELECTED 🎉 ]   [ REJECTED ]
```

### C. DPDP Deletion Request Flow
```
[ Student Profile ] ──( Click Delete Request )──> [ State: deletionRequested ]
                                                          │
                                                          ▼
                                              [ Super Admin Queue ]
                                                          │
                                                          ▼ (Confirm Wipe)
                                                [ Database Purged ]
```

---

## 4. System Safeguards & Automation

### A. Automated Expiry Job (`deadlineCloser`)
A background cron job runs at regular intervals to check active internship deadlines:
1. Queries the database for listings where the deadline is in the past and the status is still `open`.
2. Updates their status to `closed`.
3. Dispatches automated closure notices to all pending applicants of those listings.

### B. Audit Log Event Index
Every critical state change writes an entry to the system audit log. These entries cannot be modified or deleted by standard administrators:
* `TOGGLE_KILL_SWITCH`: Records when maintenance mode is turned on or off.
* `PROMOTE_USER` / `DEMOTE_USER`: Logs changes to user roles.
* `CREATE_PROFESSOR_PENDING`: Logs new professor registrations.
* `APPROVE_PROFESSOR` / `REJECT_PROFESSOR`: Tracks admin approvals and rejections.
* `TAKEDOWN_LISTING`: Logs manual closures of internships by moderators.

---

## 5. Local Development & Deployment

For technical setup, database configuration, Docker deployment keys, and network alias mapping details, please refer to the deployment documentation:
* [DOCKER_DEPLOY_GUIDE.md](file:///home/abhijith/coding/pace-website/DOCKER_DEPLOY_GUIDE.md) — Steps for server deployments, self-hosted runners, and LAN intranet setups.

### Running Backend Integration Tests
To execute all backend test suites from the root workspace directory, run:
```bash
npm run test
```
This runs the test runner inside the containerized or local test database and checks all authentication, routing, and eligibility workflows.