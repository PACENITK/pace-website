const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');
const applicationController = require('../controllers/applicationController');
const { requireAuth, requireRole, requireVerified, requireOwnership, optionalAuth } = require('../middleware/auth');
const { applyRateLimiter } = require('../middleware/rateLimiter');
const { logAudit } = require('../middleware/audit');

// Public endpoints (optional authentication to differentiate guest vs student/professor)
router.get('/', optionalAuth, internshipController.getInternships);
router.get('/:id', optionalAuth, internshipController.getInternshipById);

// Professor endpoints
router.post(
  '/',
  requireAuth,
  requireRole('professor'),
  requireVerified,
  internshipController.createInternship
);

router.patch(
  '/:id',
  requireAuth,
  requireOwnership,
  internshipController.updateInternship
);

router.patch(
  '/:id/close',
  requireAuth,
  requireOwnership,
  internshipController.closeInternship
);

// Student endpoints
router.post(
  '/:id/apply',
  requireAuth,
  requireRole('student'),
  applyRateLimiter,
  applicationController.applyToInternship
);

router.patch(
  '/:id/withdraw',
  requireAuth,
  requireRole('student'),
  applicationController.withdrawApplication
);

// Applicant listings (Professor Owner or Admin only)
router.get(
  '/:id/applicants',
  requireAuth,
  requireOwnership,
  applicationController.getApplicationsForInternship
);

router.get(
  '/:id/applications',
  requireAuth,
  requireOwnership,
  applicationController.getApplicationsForInternship
);

module.exports = router;
