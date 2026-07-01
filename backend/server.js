const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const { startDeadlineCloserJob } = require('./jobs/deadlineCloser');

const startServer = async () => {
  await connectDB();

  const PORT = config.PORT;
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    
    // Start background job runners
    startDeadlineCloserJob();
  });

  process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    server.close(() => {
      if (config.NODE_ENV !== 'test') {
        process.exit(1);
      }
    });
  });
};

startServer();
