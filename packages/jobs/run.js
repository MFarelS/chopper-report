require('dotenv').config({ path: '../firebase-functions/webpack/.env' });

const database = require('@chopper-report/database-admin');

const jobName = process.argv[process.argv.length - 1];
const job = require(`./lib/jobs/${jobName}`);

try {
  (async () => {
    database.initialize();
    await job.run();
    process.exit(0);
  })();
} catch (error) {
  console.log(error);
}
