const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/error');
const { checkMaintenance } = require('./middleware/maintenance');
const { requireAuth, requireRole } = require('./middleware/auth');
const { logAudit } = require('./middleware/audit');
const adminController = require('./controllers/adminController');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const internshipRoutes = require('./routes/internships');
const applicationRoutes = require('./routes/applications');
const reportRoutes = require('./routes/report');

const app = express();

app.use(helmet());

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(logger);

// Global Maintenance Mode check
app.use(checkMaintenance);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'PACE Backend API is healthy.' });
});

// App Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/internships', internshipRoutes);
app.use('/applications', applicationRoutes);
app.use('/report', reportRoutes);

// Root Level Super Admin / Compliance Routes
app.get(
  '/faculty-list',
  requireAuth,
  requireRole('admin', 'super_admin'),
  adminController.getFacultyList
);

app.post(
  '/faculty-list',
  requireAuth,
  requireRole('super_admin'),
  logAudit('ADD_FACULTY', 'FacultyList'),
  adminController.addFaculty
);

app.delete(
  '/faculty-list/:id',
  requireAuth,
  requireRole('super_admin'),
  logAudit('REMOVE_FACULTY', 'FacultyList'),
  adminController.deleteFaculty
);

app.get(
  '/audit-log',
  requireAuth,
  requireRole('super_admin'),
  adminController.getAuditLogs
);

app.post(
  '/users/:id/export',
  requireAuth,
  requireRole('super_admin'),
  logAudit('EXPORT_USER', 'User'),
  adminController.exportUserData
);

app.delete(
  '/users/:id',
  requireAuth,
  requireRole('super_admin'),
  logAudit('DELETE_USER', 'User'),
  adminController.deleteUser
);

app.use(errorHandler);

module.exports = app;
