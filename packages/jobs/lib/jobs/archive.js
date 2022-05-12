const database = require('@chopper-report/database-admin');

module.exports = {
  run: async () => {
    console.log('[JOBS/archive] Archiving states...');
    
    await database.archiveStates();

    console.log('[JOBS/archive] Finished archiving.');
  },
};
