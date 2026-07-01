const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// All application routes require authentication
router.use(requireAuth);

// Student own applications lookup
router.get('/mine', requireRole('student'), applicationController.getMyApplications);

// Status updates
router.patch('/:id/status', applicationController.updateApplicationStatus);
router.patch('/:id', applicationController.updateApplicationStatus); // Backwards compatibility for integration tests

// Message applicant via platform (preserves professor privacy)
router.post('/:id/message', applicationController.messageCandidate);

// Retrieve candidate resume (Audited on successful fetch)
router.get('/:id/resume', logAudit('VIEW_RESUME', 'Application'), applicationController.viewResume);

module.exports = router;
