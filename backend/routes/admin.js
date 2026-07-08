const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// All admin routes require authentication
router.use(requireAuth);

// ==========================================
// Admin / Super Admin Endpoints
// ==========================================
router.get('/professors/pending', requireRole('admin', 'super_admin'), adminController.getPendingProfessors);
router.patch('/professors/:id/approve', requireRole('admin', 'super_admin'), logAudit('APPROVE_PROFESSOR', 'User'), adminController.approveProfessor);
router.patch('/professors/:id/reject', requireRole('admin', 'super_admin'), logAudit('REJECT_PROFESSOR', 'User'), adminController.rejectProfessor);

router.get('/flagged', requireRole('admin', 'super_admin'), adminController.getFlaggedContent);
router.patch('/internships/:id/takedown', requireRole('admin', 'super_admin'), logAudit('TAKEDOWN_LISTING', 'Internship'), adminController.takedownInternship);
router.get('/disputes', requireRole('admin', 'super_admin'), adminController.getDisputes);
router.get('/analytics', requireRole('admin', 'super_admin'), adminController.getAnalytics);

// ==========================================
// Super Admin Specific Endpoints
// ==========================================
router.get('/users', requireRole('super_admin'), adminController.getUsers);
router.patch('/promote/:id', requireRole('super_admin'), logAudit('PROMOTE_USER', 'User'), adminController.promoteUser);
router.patch('/demote/:id', requireRole('super_admin'), logAudit('DEMOTE_USER', 'User'), adminController.demoteUser);

// Maintenance Mode Kill Switch
router.post('/kill-switch', requireRole('super_admin'), logAudit('TOGGLE_KILL_SWITCH', 'System'), adminController.toggleKillSwitch);

// DPDP Deletion Queue Endpoints
router.get('/delete-requests', requireRole('super_admin'), adminController.getDeletionRequests);
router.delete('/delete-requests/:id', requireRole('super_admin'), logAudit('EXECUTE_DELETION', 'User'), adminController.executeDataDeletion);

// Deprecated in favor of generic /faculty-list, but kept for compatibility
router.post('/faculty', requireRole('super_admin'), logAudit('ADD_FACULTY', 'FacultyList'), adminController.addFaculty);

module.exports = router;
