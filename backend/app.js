const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/error');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const internshipRoutes = require('./routes/internships');
const applicationRoutes = require('./routes/applications');

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

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'PACE Backend API is healthy.' });
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/internships', internshipRoutes);
app.use('/applications', applicationRoutes);

app.use(errorHandler);

module.exports = app;
