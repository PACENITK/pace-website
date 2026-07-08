const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/professor/signup', authController.professorSignup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.get('/verify', authController.verifyEmail);
router.patch('/profile', requireAuth, authController.updateProfile);
router.patch('/delete-request', requireAuth, authController.requestAccountDeletion);

module.exports = router;
