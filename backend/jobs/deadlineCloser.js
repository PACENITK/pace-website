const Internship = require('../models/Internship');

/**
 * Scans the database for internships past their deadline and updates their status to 'closed'.
 */
const closeExpiredInternships = async () => {
  console.log('[JOBS] Checking for expired internships...');
  try {
    const now = new Date();
    const expiredInternships = await Internship.find({
      status: 'open',
      deadline: { $lt: now }
    });

    if (expiredInternships.length === 0) {
      console.log('[JOBS] No expired internships found.');
      return;
    }

    for (const internship of expiredInternships) {
      internship.status = 'closed';
      await internship.save();
      console.log(`[JOBS] Auto-closed expired internship: ${internship.plateId} - "${internship.title}"`);
      console.log(`[STUB] Notification: Notifying all pending applicants for internship ID ${internship._id} that the listing has been closed.`);
    }
  } catch (error) {
    console.error('[JOBS] Error in closeExpiredInternships job:', error.message);
  }
};

/**
 * Initiates the periodic timer for the deadline closer.
 */
const startDeadlineCloserJob = () => {
  // Run once immediately on server start
  closeExpiredInternships();

  const isTest = process.env.NODE_ENV === 'test';
  // Check every second in test environment for rapid validation; check every 24 hours in dev/prod
  const intervalTime = isTest ? 1000 : 24 * 60 * 60 * 1000;

  const intervalId = setInterval(closeExpiredInternships, intervalTime);

  // Allow the node process to exit cleanly if this is the only timer active
  if (intervalId.unref) {
    intervalId.unref();
  }

  return intervalId;
};

module.exports = {
  closeExpiredInternships,
  startDeadlineCloserJob
};
