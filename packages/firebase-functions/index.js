const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const api = require('@chopper-report/api');
const jobs = require('@chopper-report/jobs');
const database = require('@chopper-report/database-admin');

database.initialize();

exports.updateStates = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  await jobs.updateStates.run();
  return null;
});

exports.api = functions.https.onRequest(api.app);
