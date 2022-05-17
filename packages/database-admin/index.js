const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const geofire = require('geofire');
const geofireCommon = require('geofire-common');
const moment = require('moment');
const { hover } = require('@chopper-report/utils');
const polyline = require('@mapbox/polyline');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

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

const writeStates = async (states) => {
  console.log('[DATABASE]', 'Writing', states.length, 'states...');

  const db = admin.firestore();
  const batch = db.batch();

  const collection = db.collection('states');

  for (let i = 0; i < states.length; i += 1) {
    const state = states[i];
    const ref = collection.doc(`${state.icao24}:${state.last_contact}`);
    
    batch.set(ref, {
      ...state,
      geohash: geofireCommon.geohashForLocation([state.latitude, state.longitude]),
    });
  }

  await batch.commit();
  console.log('[DATABASE]', 'Finished writing states.');
};

const writeMetadata = async (icao24, metadata, batch) => {
  console.log('[DATABASE]', 'Writing metadata for', icao24, '...');

  const db = admin.firestore();
  const collection = db.collection('aircrafts');
  const ref = collection.doc(icao24);

  (batch || db).set(ref, metadata);
}

const readArchive = async (key) => {
  if (key.length != 8) {
    throw new Error("Invalid key " + key);
  }

  const bucket = getStorage().bucket();
  const year = key.substring(0, 4);

  try {
    const [response] = await bucket
      .file(`statesArchive/${year}/${key}.json`)
      .download();

    return JSON.parse(response.toString());
  } catch (error) {
    if (error.code === 404) {
      return null;
    } else {
      throw error;
    }
  }
}

const writeArchive = async (archive) => {
  const bucket = getStorage().bucket();
  const year = archive.startYearMonthDay.substring(0, 4);
  const file = bucket.file(`statesArchive/${year}/${archive.startYearMonthDay}.json`);

  await file.save(JSON.stringify(archive), {
    metadata: {
      contentType: 'application/json',
    },
  });
}

const mergeArchives = async (archive) => {
  const existing = await readArchive(archive.startYearMonthDay);
  const merged = _.merge(existing || {}, archive);
  await writeArchive(merged);
}

module.exports = {
  initialize: () => {
    if (process.env.NODE_ENV === 'production') {
      admin.initializeApp();
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(require('../../firebase-account.json')),
        databaseURL: "https://chopper-report-default-rtdb.firebaseio.com",
        storageBucket: "chopper-report.appspot.com",
      });
    }
  },
  writeStates,
  metadata: async (icao24) => {
    const database = admin.firestore();
    const ref = database.collection('aircrafts').doc(icao24);
    const snapshot = await ref.get();

    return snapshot.data;
  },
  writeMetadata,
  archiveStates: async () => {
    const archiveBefore = moment().subtract(7, 'days');
    console.log('[DATABASE]', 'Archiving states before', archiveBefore.toISOString(), '...');

    const database = admin.firestore();
    let stop = false;

    while (!stop) {
      const snapshot = await database
        .collection('states')
        .where('time', '<=', archiveBefore.unix())
        .limit(500)
        .get();

      if (snapshot.docs.length === 0) {
        stop = true;
        return;
      }

      console.log('[DATABASE]', 'Downloaded', snapshot.docs.length, 'states...');

      const states = snapshot.docs.reduce((values, value) => ({ ...values, [value.id]: value.data() }), {});
      const keys = Object.keys(states);
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
                startYearMonthDay: startKey,
                endYearMonthDay: endKey,
                states: {
                  [key]: state,
                },
              },
            };
          }
        }, {});

      const archiveKeys = Object.keys(archives);

      console.log('[DATABASE]', 'Archiving', archiveKeys.length, 'periods...');

      for (let i = 0; i < archiveKeys.length; i += 1) {
        const archiveKey = archiveKeys[i];
        const archive = archives[archiveKey];

        console.log('[DATABASE]', 'Archiving', archiveKey, '...');

        await mergeArchives(archive);
      }

      console.log('[DATABASE]', 'Deleting', keys.length, 'archived states...');

      const batch = database.batch();

      for (let i = 0; i < keys.length; i += 1) {
        batch.delete(database.collection('states').doc(keys[i]));
      }

      await batch.commit();

      await new Promise(r => setTimeout(r, 1500));
    }
  },
  processRecentStates: async () => {
    const processAfter = moment().subtract(6, 'hours');
    console.log('[DATABASE]', 'Processing states since', processAfter.toISOString(), '...');

    const database = admin.firestore();
    const snapshot = await database
      .collection('states')
      .orderByKey()
      .startAt(`000000:${processAfter.unix()}`)
      .get();
    const states = snapshot.docs.reduce((values, doc) => ({ ...values, [doc.id]: doc.data() }), {});

    console.log('[DATABASE]', 'Downloaded', Object.keys(states).length, 'states...');

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
  migrate: async () => {
    const database = admin.database();
    const db = admin.firestore();
    let stop = false;

    while (!stop) {
      const batch = db.batch();
      const snapshot = await database
        .ref('aircrafts')
        .orderByKey()
        .limitToFirst(500)
        .once('value');
      const aircrafts = snapshot.val();
      const keys = Object.keys(aircrafts || {});

      console.log('[DATABASE]', 'Downloaded', keys.length, 'aircrafts...');

      if (keys.length === 0) {
        stop = true;
      }

      for (let i = 0; i < keys.length; i += 1) {
        await writeMetadata(keys[i], aircrafts[keys[i]], batch);
      }

      await batch.commit();

      const deletions = keys
        .reduce((values, key) => ({ ...values, [key]: null }), {});

      console.log('[DATABASE]', 'Deleting', keys.length, 'migrated aircrafts...');

      await database.ref('aircrafts').update(deletions);
    }
  },
};
