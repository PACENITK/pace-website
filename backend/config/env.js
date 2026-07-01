const dotenv = require('dotenv');
const path = require('path');

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv !== 'production' && nodeEnv !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, `../.env.development`) });
} else if (nodeEnv === 'production') {
  dotenv.config({ path: path.resolve(__dirname, `../.env.production`) });
} else if (nodeEnv === 'test') {
  dotenv.config({ path: path.resolve(__dirname, `../.env.development`) });
}

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: nodeEnv,
  MONGO_URI: process.env.MONGO_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  IRIS_CLIENT_ID: process.env.IRIS_CLIENT_ID,
  IRIS_CLIENT_SECRET: process.env.IRIS_CLIENT_SECRET,
  IRIS_CALLBACK_URL: process.env.IRIS_CALLBACK_URL,
  IRIS_AUTHORIZATION_URL: process.env.IRIS_AUTHORIZATION_URL,
  IRIS_TOKEN_URL: process.env.IRIS_TOKEN_URL,
  IRIS_PROFILE_URL: process.env.IRIS_PROFILE_URL,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

if (nodeEnv !== 'test') {
  const required = [
    'MONGO_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'IRIS_CLIENT_ID',
    'IRIS_CLIENT_SECRET',
    'IRIS_CALLBACK_URL',
    'IRIS_AUTHORIZATION_URL',
    'IRIS_TOKEN_URL',
    'IRIS_PROFILE_URL',
    'SUPER_ADMIN_EMAIL',
    'SUPER_ADMIN_NAME'
  ];

  const missing = required.filter(key => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in ${nodeEnv} mode: ${missing.join(', ')}`);
  }
}

module.exports = config;
