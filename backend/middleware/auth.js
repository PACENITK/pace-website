const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Internship = require('../models/Internship');

const requireAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Not authorized, token expired' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied for role '${req.user ? req.user.role : 'unauthenticated'}'`
      });
    }
    next();
  };
};

const requireVerified = (req, res, next) => {
  if (req.user && req.user.role === 'professor') {
    if (req.user.status !== 'approved' || !req.user.verified) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Your professor account is pending admin approval or has been rejected/unverified'
      });
    }
  }
  next();
};

const requireOwnership = async (req, res, next) => {
  const internshipId = req.params.id || req.params.internshipId;

  if (!internshipId) {
    return res.status(400).json({ success: false, message: 'Internship ID is required for ownership check' });
  }

  try {
    const internship = await Internship.findById(internshipId);

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship listing not found' });
    }

    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      req.internship = internship;
      return next();
    }

    if (internship.professorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have ownership of this internship listing'
      });
    }

    req.internship = internship;
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    req.user = user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  requireAuth,
  requireRole,
  requireVerified,
  requireOwnership,
  optionalAuth
};
