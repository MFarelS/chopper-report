const database = require('@chopper-report/database-admin');
const fs = require('fs');
const path = require('path');

module.exports = {
  run: async ([ input ]) => {
    if (input) {
      console.log('[JOBS/process] Processing states in file:', input, '...');

      const contents = await fs.promises.readFile(path.resolve(input));
      let states = JSON.parse(contents);

      if (states.states) {
        states = states.states;
      }

      console.log('[JOBS/process] Found', Object.keys(states).length, 'states...');

      await database.processStates(states);

      return null;
    } else {
      console.log('[JOBS/process] Processing recent states...');

      return await database.processRecentStates();
    }
  },
};
