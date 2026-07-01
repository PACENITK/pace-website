const jwt = require('jsonwebtoken');
const config = require('../config/env');
const SystemConfig = require('../models/SystemConfig');

let isMaintenanceActive = null;

const checkMaintenance = async (req, res, next) => {
  try {
    // 1. Check if the user is a Super Admin
    let role = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        role = decoded.role;
      } catch (err) {
        // Suppress verification errors; they will be handled by requireAuth
      }
    }

    if (role === 'super_admin') {
      return next();
    }

    // 2. Fetch maintenance mode state
    if (isMaintenanceActive === null) {
      const mode = await SystemConfig.findOne({ key: 'maintenanceMode' });
      isMaintenanceActive = mode ? !!mode.value : false;
    }

    if (isMaintenanceActive) {
      return res.status(503).json({
        success: false,
        message: 'Service Unavailable: Platform is currently in maintenance mode.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const setMaintenanceCache = (value) => {
  isMaintenanceActive = !!value;
};

const clearMaintenanceCache = () => {
  isMaintenanceActive = null;
};

module.exports = {
  checkMaintenance,
  setMaintenanceCache,
  clearMaintenanceCache
};
