const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/iris/login', authController.irisLogin);
router.get('/iris/callback', authController.irisCallback);
router.post('/signup', authController.signup);
router.post('/professor/signup', authController.professorSignup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
