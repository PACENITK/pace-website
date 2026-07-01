const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Report = require('../models/Report');

/**
 * POST /report
 * Report a listing or user profile (Authenticated users only)
 */
router.post('/', requireAuth, async (req, res, next) => {
  const { targetType, targetId, reason } = req.body;

  if (!targetType || !targetId || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Please provide targetType (User or Internship), targetId, and reason.'
    });
  }

  if (targetType !== 'User' && targetType !== 'Internship') {
    return res.status(400).json({
      success: false,
      message: 'Invalid targetType. Must be either User or Internship.'
    });
  }

  try {
    const report = await Report.create({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Content reported successfully.',
      data: report
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
