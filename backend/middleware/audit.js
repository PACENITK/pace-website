const AuditLog = require('../models/AuditLog');

/**
 * Middleware to log sensitive actions in the AuditLog collection on successful response (2xx).
 * @param {string} action - The action name (e.g. VIEW_RESUME, APPROVE_PROFESSOR).
 * @param {string} targetType - The target resource model name (e.g. User, Internship, Application).
 * @param {Function} [getTargetId] - Async/Sync function to retrieve the target ID from req/res. Defaults to req.params.id.
 * @param {Function} [getMetadata] - Async/Sync function to retrieve metadata.
 */
const logAudit = (action, targetType, getTargetId, getMetadata) => {
  return (req, res, next) => {
    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Resolve targetId
          let targetId = null;
          if (getTargetId) {
            targetId = await getTargetId(req, res);
          } else if (req.params.id) {
            targetId = req.params.id;
          } else if (req.params.internshipId) {
            targetId = req.params.internshipId;
          }

          // Resolve actorId (logged-in user)
          const actorId = req.user ? req.user._id : null;

          if (!actorId) {
            return; // Only log actions done by authenticated users
          }

          // Resolve metadata
          const metadata = getMetadata ? await getMetadata(req, res) : undefined;

          await AuditLog.create({
            actorId,
            action,
            targetType,
            targetId,
            metadata
          });
        }
      } catch (err) {
        console.error(`Failed to write audit log for action ${action}:`, err.message);
      }
    });
    next();
  };
};

module.exports = { logAudit };
