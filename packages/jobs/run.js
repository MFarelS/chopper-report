require('dotenv').config({ path: '../firebase-functions/webpack/.env' });

const database = require('@chopper-report/database-admin');

const jobName = process.argv[2];
const job = require(`./lib/jobs/${jobName}`);

try {
  (async () => {
    database.initialize();
    await job.run(process.argv.slice(3));
    process.exit(0);
  })();
} catch (error) {
  console.log(error);
}
