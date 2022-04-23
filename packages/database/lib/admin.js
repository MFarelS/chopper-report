module.exports = {
  initialize: () => {
    const admin = require('firebase-admin');

    if (process.env.NODE_ENV === 'production') {
      admin.initializeApp();
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(require('../../../firebase-account.json')),
        databaseURL: "https://chopper-report-default-rtdb.firebaseio.com"
      });
    }
  },
  writeStates: async (states) => {
    const admin = require('firebase-admin');
    const geofire = require('geofire');

    console.log('[DATABASE]', 'Writing', states.length, 'states...');
    
    const database = admin.database();
    const ref = database.ref('states');
    const geoFireInstance = new geofire.GeoFire(database.ref('geofire'));
    let locations = {};
    let updates = {};

    for (let state of states) {
      const id = `${state.time}:${state.icao24}`;
      locations[id] = [state.latitude, state.longitude];
      updates[id] = state;
    }

    await ref.update(updates);
    await geoFireInstance.set(locations);
    console.log('[DATABASE]', 'Finished writing states.');
  },
};