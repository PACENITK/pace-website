const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (config.NODE_ENV === 'development' && statusCode === 500) {
    console.error(err);
  }

  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  if (err.name === 'JsonWebTokenError') {
    message = 'Not authorized, token failed';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Not authorized, token expired';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;

