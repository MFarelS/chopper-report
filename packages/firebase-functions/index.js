const functions = require('firebase-functions');
const admin = require('firebase-admin');
const jobs = require('@chopper-report/jobs');
const database = require('@chopper-report/database');

database.admin().initialize();

exports.updateStates = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  await jobs.updateStates.run();
  return null;
});
