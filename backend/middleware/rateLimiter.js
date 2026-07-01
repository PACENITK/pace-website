const rateLimitMap = new Map();

const applyRateLimiter = (req, res, next) => {
  // Rate limiting only applies to students submitting internship applications
  if (!req.user || req.user.role !== 'student') {
    return next();
  }

  const studentId = req.user._id.toString();
  const now = Date.now();

  const isTest = process.env.NODE_ENV === 'test';
  const WINDOW_MS = isTest ? 2000 : 15 * 60 * 1000; // 2 seconds for test, 15 minutes for dev/prod
  const MAX_LIMIT = isTest ? 2 : 5; // Max 2 applications for test, 5 for dev/prod

  if (!rateLimitMap.has(studentId)) {
    rateLimitMap.set(studentId, []);
  }

  // Filter timestamps to only keep those within the current window
  const timestamps = rateLimitMap.get(studentId).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_LIMIT) {
    return res.status(429).json({
      success: false,
      message: 'Too many applications submitted. Please try again later.',
    });
  }

  timestamps.push(now);
  rateLimitMap.set(studentId, timestamps);
  next();
};

module.exports = { applyRateLimiter };
