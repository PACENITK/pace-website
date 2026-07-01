const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const FacultyList = require('../models/FacultyList');
const AuditLog = require('../models/AuditLog');
const irisService = require('../services/irisService');

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

const sendIrisTokens = (user, statusCode, res, isFacultyPending = false) => {
  const redirectUrl = isFacultyPending
    ? `${config.FRONTEND_URL}/portal/auth/complete?pending=true`
    : `${config.FRONTEND_URL}/portal/auth/complete`;

  if (!isFacultyPending) {
    const refreshToken = generateRefreshToken(user);
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
    };
    res.cookie('refreshToken', refreshToken, cookieOptions);
  }

  if (config.NODE_ENV === 'test') {
    if (isFacultyPending) {
      return res.status(201).json({
        success: true,
        message: 'IRIS authentication successful. Professor account created and is awaiting Admin review.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          verified: user.verified
        },
        redirectUrl
      });
    } else {
      const userObj = user.toObject();
      delete userObj.passwordHash;
      return res.status(statusCode).json({
        success: true,
        accessToken: generateAccessToken(user),
        user: userObj,
        redirectUrl
      });
    }
  }

  res.redirect(redirectUrl);
};

/**
 * GET /auth/iris/login
 * Redirects user to IRIS OAuth site with a secure state token
 */
exports.irisLogin = (req, res) => {
  const state = crypto.randomBytes(20).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    maxAge: 600000,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  const authUrl = `${config.IRIS_AUTHORIZATION_URL}?client_id=${config.IRIS_CLIENT_ID}&redirect_uri=${encodeURIComponent(config.IRIS_CALLBACK_URL)}&response_type=code&scope=profile&state=${state}`;

  res.redirect(authUrl);
};

/**
 * GET /auth/iris/callback
 * Receives code & state from IRIS, exchanges, profiles, and handles User registration/upgrade
 */
exports.irisCallback = async (req, res, next) => {
  const { code, state } = req.query;
  const oauthState = req.cookies.oauth_state;

  if (!state || !oauthState || state !== oauthState) {
    return res.status(400).json({ success: false, message: 'Invalid state parameter or authorization request timed out.' });
  }

  res.clearCookie('oauth_state');

  if (!code) {
    return res.status(400).json({ success: false, message: 'Authorization code was not provided.' });
  }

  try {
    const token = await irisService.exchangeCodeForToken(code);
    const profile = await irisService.getProfile(token);
    const email = profile.email ? profile.email.toLowerCase() : null;
    const name = profile.name;
    const rollNumber = profile.rollNumber ? profile.rollNumber.trim() : null;

    if (!email) {
      return res.status(400).json({ success: false, message: 'IRIS profile did not return a valid email address.' });
    }

    const isFaculty = await FacultyList.findOne({ email });

    let user = await User.findOne({
      $or: [
        { email },
        ...(rollNumber ? [{ rollNumber }] : [])
      ]
    });

    if (user) {
      let updated = false;
      if (user.role === 'student' && user.studentType === 'external') {
        user.studentType = 'nitk';
        user.irisVerified = true;
        user.verified = true;
        if (rollNumber) user.rollNumber = rollNumber;
        user.profile.cgpaSource = 'iris_verified';

        await user.save();
        updated = true;

        await AuditLog.create({
          actorId: user._id,
          action: 'UPGRADE_EXTERNAL_TO_NITK',
          targetType: 'User',
          targetId: user._id,
          metadata: { email: user.email, rollNumber }
        });
      }

      if (!user.irisVerified) {
        user.irisVerified = true;
        await user.save();
      }

      return sendIrisTokens(user, 200, res);
    } else {
      if (isFaculty) {
        user = await User.create({
          role: 'professor',
          name,
          email,
          irisVerified: true,
          verified: false,
          status: 'pending',
          profile: {
            college: 'NITK Surathkal',
            branch: isFaculty.department || ''
          }
        });

        await AuditLog.create({
          actorId: user._id,
          action: 'CREATE_PROFESSOR_PENDING',
          targetType: 'User',
          targetId: user._id,
          metadata: { method: 'iris', email }
        });

        return sendIrisTokens(user, 201, res, true);
      } else {
        user = await User.create({
          role: 'student',
          studentType: 'nitk',
          name,
          email,
          rollNumber,
          irisVerified: true,
          verified: true,
          profile: {
            college: 'NITK Surathkal',
            cgpaSource: 'iris_verified'
          }
        });

        await AuditLog.create({
          actorId: user._id,
          action: 'CREATE_USER_IRIS',
          targetType: 'User',
          targetId: user._id,
          metadata: { email, rollNumber }
        });

        return sendIrisTokens(user, 201, res);
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/signup
 * External student signup
 */
exports.signup = async (req, res, next) => {
  const { name, email, password, profile } = req.body;

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address.' });
    }

    const user = await User.create({
      role: 'student',
      studentType: 'external',
      name,
      email,
      passwordHash: password,
      irisVerified: false,
      verified: true,
      profile: {
        ...profile,
        cgpaSource: 'self_reported'
      }
    });

    await AuditLog.create({
      actorId: user._id,
      action: 'CREATE_USER_EXTERNAL',
      targetType: 'User',
      targetId: user._id
    });

    sendTokens(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/professor/signup
 * Fallback pathway for professors, domain-restricted
 */
exports.professorSignup = async (req, res, next) => {
  const { name, email, password, department, profile } = req.body;

  try {
    const emailLower = email.toLowerCase();
    const nitkPattern = /^[a-zA-Z0-9._%+-]+@nitk\.(edu|ac)\.in$/;
    if (!nitkPattern.test(emailLower)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email. Only NITK email domains (*@nitk.edu.in or *@nitk.ac.in) are allowed for professor signup.'
      });
    }

    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address.' });
    }

    const user = await User.create({
      role: 'professor',
      name,
      email: emailLower,
      passwordHash: password,
      verified: false,
      status: 'pending',
      profile: {
        ...profile,
        college: 'NITK Surathkal',
        branch: department
      }
    });

    await AuditLog.create({
      actorId: user._id,
      action: 'CREATE_PROFESSOR_PENDING',
      targetType: 'User',
      targetId: user._id,
      metadata: { method: 'email', email: emailLower }
    });

    res.status(201).json({
      success: true,
      message: 'Professor signup successful. Your account is pending admin approval.',
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
 * Log in via email and password
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
