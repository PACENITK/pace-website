const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');
const applicationController = require('../controllers/applicationController');
const { requireAuth, requireRole, requireVerified, requireOwnership } = require('../middleware/auth');

router.get('/', requireAuth, internshipController.getInternships);
router.get('/:id', requireAuth, internshipController.getInternshipById);

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

router.post(
  '/:id/apply',
  requireAuth,
  requireRole('student'),
  applicationController.applyToInternship
);

router.get(
  '/:id/applications',
  requireAuth,
  requireOwnership,
  applicationController.getApplicationsForInternship
);

module.exports = router;

