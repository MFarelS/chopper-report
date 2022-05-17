const database = require('@chopper-report/database-admin');

module.exports = {
  run: async () => {
    console.log('[JOBS/migrate] Migrating states...');
    
    await database.migrate();

    console.log('[JOBS/migrate] Finished migration.');
  },
};
