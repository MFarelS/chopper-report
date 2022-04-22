const functions = require('firebase-functions');
const admin = require('firebase-admin');
const jobs = require('@chopper-report/jobs');

exports.updateStates = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  await jobs.updateStates.run(admin.database());
  return null;
});
