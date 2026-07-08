const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const FacultyList = require('../models/FacultyList');
const AuditLog = require('../models/AuditLog');
const emailService = require('../services/emailService');

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRY,
  });
};

const sendTokens = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  const userObj = user.toObject();
  delete userObj.passwordHash;

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: userObj,
  });
};

exports.verifyEmail = async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Verification token is required.' });
  }

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    user.verified = true;
    user.verificationToken = null;
    await user.save();

    await AuditLog.create({
      actorId: user._id,
      action: 'VERIFY_EMAIL',
      targetType: 'User',
      targetId: user._id,
      metadata: { email: user.email }
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You may now log in.'
    });
  } catch (error) {
    next(error);
  }
};

exports.requestAccountDeletion = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role !== 'student') {
      return res.status(400).json({ success: false, message: 'Account deletion requests are only supported for student accounts.' });
    }

    user.deletionRequested = true;
    await user.save();

    await AuditLog.create({
      actorId: user._id,
      action: 'REQUEST_ACCOUNT_DELETION',
      targetType: 'User',
      targetId: user._id,
      metadata: { email: user.email }
    });

    res.status(200).json({
      success: true,
      message: 'Your deletion request has been submitted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/signup
 * Student signup (Any college, auto-badge NITK domain emails)
 */
exports.signup = async (req, res, next) => {
  const { name, email, password, profile } = req.body;

  try {
    const emailLower = email.toLowerCase();
    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address.' });
    }

    const nitkPattern = /^[a-zA-Z0-9._%+-]+@nitk\.(edu|ac)\.in$/;
    const isNitk = nitkPattern.test(emailLower);
    const studentType = isNitk ? 'nitk' : 'external';

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const isTest = process.env.NODE_ENV === 'test';

    const user = await User.create({
      role: 'student',
      studentType,
      name,
      email: emailLower,
      passwordHash: password,
      irisVerified: isNitk,
      verified: isTest, // Auto-verify in test environment
      verificationToken: isTest ? null : verificationToken,
      profile: {
        ...profile,
        college: isNitk ? 'NITK Surathkal' : (profile?.college || ''),
        cgpaSource: isNitk ? 'iris_verified' : 'self_reported'
      }
    });

    await AuditLog.create({
      actorId: user._id,
      action: 'CREATE_USER_STUDENT',
      targetType: 'User',
      targetId: user._id,
      metadata: { email: emailLower, studentType }
    });

    if (!isTest) {
      await emailService.sendVerificationEmail(emailLower, name, verificationToken);
    }

    if (isTest) {
      return sendTokens(user, 201, res);
    }

    res.status(201).json({
      success: true,
      message: 'Signup successful! Please check your email inbox to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/professor/signup
 * Onboarding for any institutional professors, manual admin approval required
 */
exports.professorSignup = async (req, res, next) => {
  const { name, email, password, institution, department, proofOfStatus, profile } = req.body;

  try {
    const emailLower = email.toLowerCase();
    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const isTest = process.env.NODE_ENV === 'test';

    const user = await User.create({
      role: 'professor',
      name,
      email: emailLower,
      passwordHash: password,
      verified: isTest, // Auto-verify in test environment
      verificationToken: isTest ? null : verificationToken,
      status: 'pending',
      proofOfStatus: proofOfStatus || '',
      profile: {
        ...profile,
        college: institution || '',
        branch: department || ''
      }
    });

    await AuditLog.create({
      actorId: user._id,
      action: 'CREATE_PROFESSOR_PENDING',
      targetType: 'User',
      targetId: user._id,
      metadata: { email: emailLower, institution: institution || '' }
    });

    if (!isTest) {
      await emailService.sendVerificationEmail(emailLower, name, verificationToken);
    }

    res.status(201).json({
      success: true,
      message: isTest
        ? 'Professor signup successful. Your account is pending admin approval.'
        : 'Professor signup successful! Please check your email to verify your address. Account is pending admin approval.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        verified: user.verified
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 * Log in via email and password with verification guards
 */
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide an email and password.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 1. Email Verification Guard
    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address. A verification link was sent to your inbox.'
      });
    }

    // 2. Professor Approval Guard
    if (user.role === 'professor') {
      if (user.status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your registration request has been declined by the platform administrators.'
        });
      }
    }

    sendTokens(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh
 * Rotate access tokens using httpOnly refresh token cookie
 */
exports.refresh = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid session.' });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
};

/**
 * POST /auth/logout
 * Invalidate session by clearing httpOnly cookies
 */
exports.logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
  * GET /auth/me
  * Restore student or professor session state using httpOnly refresh token cookie
  */
exports.getMe = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Not authorized, no session cookie found.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found.' });
    }

    const accessToken = generateAccessToken(user);
    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(200).json({
      success: true,
      accessToken,
      user: userObj,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, session expired.' });
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.body.name) {
      user.name = req.body.name;
    }

    if (req.body.profile) {
      user.profile = {
        ...user.profile,
        ...req.body.profile
      };
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: userObj
    });
  } catch (error) {
    next(error);
  }
};
