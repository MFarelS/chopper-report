const admin = require('firebase-admin');
const geofire = require('geofire');
const geofireCommon = require('geofire-common');
const moment = require('moment');
const { hover } = require('@chopper-report/utils');
const polyline = require('@mapbox/polyline');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const processStates = async (states) => {
  const keys = Object.keys(states || {});
  const { hoveringAircrafts, flights } = hover.getEvents(states);
  const db = admin.firestore();
  const collection = db.collection('hoverEvents');
  const icaos = Object.keys(hoveringAircrafts);
  const events = icaos.flatMap(icao24 => hoveringAircrafts[icao24]);

  console.log('[DATABASE]', 'Processing', events.length, 'hover events...');

  const chunks = _.chunk(events, 500);

  for (let i = 0; i < chunks.length; i += 1) {
    const batch = db.batch();
    const chunk = chunks[i];

    for (let j = 0; j < chunk.length; j += 1) {
      const event = chunk[j];
      const states = event.states;
      delete event.states;
      const ref = collection.doc(`${event.icao24}:${event.startTime}`);
      
      batch.set(ref, {
        ...event,
        routePolyline: polyline.encode(states.map(state => [state.latitude, state.longitude])),
      });
    }

    await batch.commit();
  }

  const flightIDs = Object.keys(flights);
  console.log('[DATABASE]', 'Processing', flightIDs.length, 'flights...');
  const flightChunks = _.chunk(flightIDs, 500);
  const flightCollection = db.collection('flights');

  for (let i = 0; i < flightChunks.length; i += 1) {
    const batch = db.batch();
    const chunk = flightChunks[i];

    for (let j = 0; j < chunk.length; j += 1) {
      const flightID = chunk[j];
      const flight = flights[flightID];
      const ref = flightCollection.doc(flightID);
      
      batch.set(ref, flight);
    }

    await batch.commit();
  }
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

  const bucket = firebase.storage().bucket();
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
  const bucket = firebase.storage().bucket();
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

const writeStatesToArchive = async (states) => {
  const database = admin.firestore();
  const keys = Object.keys(states);
  const now = moment();

  console.log('[DATABASE]', 'Archiving', keys.length, 'states...');

  const archives = keys
    .reduce((values, key) => {
      const state = states[key];
      const time = moment.unix(state.time);
      const archiveStart = time.startOf('isoWeek').add(5, 'hours');
      const archiveEnd = moment(archiveStart).add(1, 'week');
      const startKey = archiveStart.format('YYYYMMDD');
      const endKey = archiveEnd.subtract(1, 'day').format('YYYYMMDD');

      if (values[startKey]) {
        const existing = values[startKey];
        values[startKey].states[key] = state;

        return values;
        // return {
        //   ...values,
        //   [startKey]: {
        //     ...values[startKey],
        //     states: {
        //       ...(values[startKey].states || {}),
        //       [key]: state,
        //     }
        //   }
        // }
      } else {
        values[startKey] = {
          startYearMonthDay: startKey,
          endYearMonthDay: endKey,
          states: {
            [key]: state,
          },
        }
        return values;
        // return {
        //   ...values,
        //   [startKey]: {
        //     startYearMonthDay: startKey,
        //     endYearMonthDay: endKey,
        //     states: {
        //       [key]: state,
        //     },
        //   },
        // };
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
}

const deleteStates = async (states) => {
  const database = admin.firestore();
  const keys = Object.keys(states);

  console.log('[DATABASE]', 'Deleting', keys.length, 'archived states...');

  const chunks = _.chunk(keys, 500);

  for (let i = 0; i < chunks.length; i += 1) {
    const batch = database.batch();

    console.log('[DATABASE]', 'Deleting states', `${i * 500}-${(i * 500) + Math.min(500, chunks[i].length)}...`);

    for (let j = 0; j < chunks[i].length; j += 1) {
      batch.delete(database.collection('states').doc(chunks[i][j]));
    }

    await batch.commit();
  }
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
  archiveStates: async (states) => {
    const archiveBefore = moment().subtract(30, 'days');
    console.log('[DATABASE]', 'Archiving states before', archiveBefore.toISOString(), '...');

    const database = admin.firestore();
    
    if (states && states.length > 0) {
      await writeStatesToArchive(states);
      await deleteStates(states);
    } else {
      let stop = false;
      const allStates = {};
      let lastTime = 0

      while (!stop) {
        if (lastTime > 0) {
          console.log('[DATABASE]', 'Downloading states after', lastTime, '...');
        }

        let query = database
          .collection('states')
          .where('time', '<=', archiveBefore.unix())
          .orderBy('time')
          .limit(5000);
        if (Object.keys(allStates).length > 0) {
          query = query.where('time', '>', lastTime);
        }
        const snapshot = await query
          .get();

        if (snapshot.docs.length === 0) {
          stop = true;
        } else {
          console.log('[DATABASE]', 'Downloaded', snapshot.docs.length, 'states...');

          const states = snapshot.docs.reduce((values, value) => {
            values[value.id] = value.data();
            return values;
          }, {});
          Object.assign(allStates, states);
          lastTime = snapshot.docs.slice(-1)[0].data().time;
        }
      }

      await writeStatesToArchive(allStates);
      await deleteStates(allStates);
    }
  },
  processRecentStates: async () => {
    const processAfter = moment().subtract(6, 'hours');
    console.log('[DATABASE]', 'Processing states since', processAfter.toISOString(), '...');

    const database = admin.firestore();
    const snapshot = await database
      .collection('states')
      .orderBy('time')
      .where('time', '>', processAfter.unix())
      .get();
    const states = snapshot.docs.reduce((values, value) => {
      values[value.id] = value.data();
      return values;
    }, {});

    console.log('[DATABASE]', 'Downloaded', Object.keys(states).length, 'states...');

    await processStates(states);

    return states;
  },
  processStates,
  migrate: async () => {
    
  },
};
