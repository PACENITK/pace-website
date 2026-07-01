const morgan = require('morgan');
const config = require('../config/env');

const logger = morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev');

module.exports = logger;
