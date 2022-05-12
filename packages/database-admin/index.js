const admin = require('firebase-admin');
const geofire = require('geofire');
const geofireCommon = require('geofire-common');
const moment = require('moment');
const { hover } = require('@chopper-report/utils');

const flattenObject = (obj = {}, res = {}, extraKey = '') => {
  for (key in obj) {
    if (typeof obj[key] !== 'object') {
      res[extraKey + key] = obj[key];
    } else {
      flattenObject(obj[key], res, `${extraKey}${key}/`);
    }
  }

  return res;
};

const processStates = async (states) => {
  const keys = Object.keys(states || {});
  const hoveringAircrafts = hover.getEvents(states, {
    excludeStates: true,
  });

  console.log('[DATABASE]', 'Downloaded', keys.length, 'states...');

  // console.log(hoveringAircrafts);
  const db = admin.firestore();
  const batch = db.batch();

  const collection = db.collection('hoverEvents');

  const icaos = Object.keys(hoveringAircrafts);
  for (let i = 0; i < icaos.length; i += 1) {
    const icao24 = icaos[i];
    const events = hoveringAircrafts[icao24];
    
    for (let j = 0; j < events.length; j += 1) {
      const event = events[j];
      const ref = collection.doc(`${icao24}:${event.startTime}`);
      
      batch.set(ref, {
        ...event,
        icao24,
      });
    }
  }

  await batch.commit();
};

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
  archiveStates: async () => {
    const archiveBefore = moment().subtract(7, 'days');
    console.log('[DATABASE]', 'Archiving states before', archiveBefore.toISOString(), '...');

    let shouldRepeat = true;

    const database = admin.database();

    while (shouldRepeat) {
      const snapshot = await database
        .ref('states')
        .orderByKey()
        .startAt('000000:0')
        .endAt(`ffffff:${archiveBefore.unix()}`)
        .limitToFirst(10000)
        .once('value');
      const states = snapshot.val();
      const keys = Object.keys(states || {});

      console.log('[DATABASE]', 'Downloaded', keys.length, 'states...');

      if (keys.length === 0) {
        shouldRepeat = false;
      }

      const now = moment();

      const archives = keys
        .reduce((values, key) => {
          const state = states[key];
          const time = moment.unix(state.time);
          const archiveStart = time.startOf('isoWeek').add(5, 'hours');
          const archiveEnd = moment(archiveStart).add(1, 'week');
          const startKey = archiveStart.format('YYYYMMDD');
          const endKey = archiveEnd.subtract(1, 'day').format('YYYYMMDD');

          if (values[startKey]) {
            return {
              ...values,
              [startKey]: {
                ...values[startKey],
                states: {
                  ...(values[startKey].states || {}),
                  [key]: state,
                }
              }
            }
          } else {
            return {
              ...values,
              [startKey]: {
                endYearMonthDay: endKey,
                states: {
                  [key]: state,
                },
              },
            };
          }
        }, {});

      console.log('[DATABASE]', 'Archiving', Object.keys(archives).length, 'periods...');

      await database.ref('archivedStates').update(flattenObject(archives));

      const deletions = keys
        .reduce((values, key) => ({ ...values, [key]: null }), {});

      console.log('[DATABASE]', 'Deleting', keys.length, 'archived states...');

      await database.ref('states').update(deletions);
    }
  },
  processRecentStates: async () => {
    const processAfter = moment().subtract(12, 'hours');
    console.log('[DATABASE]', 'Processing states since', processAfter.toISOString(), '...');

    const database = admin.database();
    const snapshot = await database
      .ref('states')
      .orderByKey()
      .startAt(`000000:${processAfter.unix()}`)
      .once('value');
    const states = snapshot.val();

    return await processStates(states);

    // const database = admin.database();
    // const snapshot = await database
    //     .ref('archivedStates/20220509/states')
    //     .orderByKey()
    //     .once('value');
    // const states = snapshot.val();
    // await processStates(states);
  },
  processStates,
};
