const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/professors/pending', requireRole('admin', 'super_admin'), adminController.getPendingProfessors);
router.patch('/professors/:id/approve', requireRole('admin', 'super_admin'), adminController.approveProfessor);
router.patch('/professors/:id/reject', requireRole('admin', 'super_admin'), adminController.rejectProfessor);

router.post('/faculty', requireRole('super_admin'), adminController.addFaculty);

module.exports = router;
