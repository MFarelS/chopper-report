const admin = require('firebase-admin');
const geofire = require('geofire');

module.exports = {
  initialize: () => {
    if (process.env.NODE_ENV === 'production') {
      admin.initializeApp();
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(require('../../firebase-account.json')),
        databaseURL: "https://chopper-report-default-rtdb.firebaseio.com"
      });
    }
  },
  writeStates: async (states) => {
    console.log('[DATABASE]', 'Writing', states.length, 'states...');
    
    const database = admin.database();
    const ref = database.ref('states');
    const geoFireInstance = new geofire.GeoFire(database.ref('geofire'));
    let locations = {};
    let updates = {};

    for (let state of states) {
      locations[state.icao24] = [state.latitude, state.longitude];
      updates[`${state.icao24}:${state.time}`] = state;
    }

    await ref.update(updates);
    await geoFireInstance.set(locations);
    console.log('[DATABASE]', 'Finished writing states.');
  },
  metadata: async (icao24) => {
    const database = admin.database();
    const ref = database.ref('aircrafts').child(icao24);
    const snapshot = await ref.once('value');

    return snapshot.val();
  },
  writeMetadata: async (icao24, metadata) => {
    console.log('[DATABASE]', 'Writing metadata for', icao24, '...');
    const database = admin.database();
    const ref = database.ref('aircrafts').child(icao24);
    await ref.set(metadata);
  },
};