const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { requireAuth } = require('../middleware/auth');

router.patch('/:id', requireAuth, applicationController.updateApplicationStatus);

module.exports = router;
