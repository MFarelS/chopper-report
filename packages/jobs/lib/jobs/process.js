const database = require('@chopper-report/database-admin');

module.exports = {
  run: async () => {
    console.log('[JOBS/process] Processing states...');

    await database.processRecentStates();

    console.log('[JOBS/process] Finished processing.');
  },
};
