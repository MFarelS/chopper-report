const database = require('@chopper-report/database-admin');

module.exports = {
  run: async (states) => {
    console.log('[JOBS/archive] Archiving states...');
    
    await database.archiveStates(states);

    console.log('[JOBS/archive] Finished archiving.');
  },
};
