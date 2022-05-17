module.exports = {
  updateStates: require('./lib/jobs/update'),
  archiveStates: require('./lib/jobs/archive'),
  processStates: require('./lib/jobs/process'),
  migrate: require('./lib/jobs/migrate'),
};
