import firebase from 'firebase/app';
import 'firebase/firestore';
import * as turf from "@turf/turf";
import * as moment from "moment";
// import { hover } from '@chopper-report/utils';
import { GeoFire } from 'geofire';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';

export function initialize() {
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    databaseURL: `https://${process.env.REACT_APP_FIREBASE_DATABASE_NAME}.firebaseio.com`,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };

  firebase.initializeApp(firebaseConfig);
}

// export async function countReport(icao24, reportType) {
//   const ref = firebase.app().database().ref(`reports/${reportType}/${icao24}`);

//   await ref.transaction((current) => {
//     return current + 1;
//   });
// }

export async function metadata(icao24) {
  const database = firebase.app().firestore();
  const ref = database.collection('aircrafts').doc(icao24);
  const snapshot = await ref.get();
  const value = snapshot.data();

  return {
    ...value,
    manufacturer: (value?.manufacturer || '').replace("Bell Helicopter Textron Canada", "Bell"),
  };
}

export async function state(icao24, time) {
  const database = firebase.app().firestore();
  const snapshot = await database
    .collection('states')
    .orderBy('time')
    .where('icao24', '==', icao24)
    .startAt(`${icao24}:`)
    .endAt(`${icao24}:\uf8ff`)
    .limitToLast(1)
    .get();
  const value = snapshot.docs.reduce((values, value) => ({ ...values, [value.id]: value.data() }), {});
  const key = Object.keys(value)[0];

  return value[key];
}

export async function history(icao24, begin, end) {
  const date = moment.unix(begin);
  const currentPeriodStart = moment().subtract(7, 'days');

  const database = firebase.app().firestore();
  const snapshot = await database
    .collection('states')
    .where('icao24', '==', icao24)
    .where('time', '>=', begin)
    .where('time', '<=', end)
    .orderBy('time', 'asc')
    .get();
  const value = snapshot.docs.reduce((values, value) => ({ ...values, [value.id]: value.data() }), {});
  const values = Object.values(value || {})
    .sort((x, y) => {
      return x.time - y.time;
    });

  return values;
}

export async function historicStates(location, radius, begin, end) {
  const bounds = geohashQueryBounds(location, radius);
  const date = moment.unix(begin);

  const db = firebase.app().firestore();
  let docs = [];

  for (const b of bounds) {
    const snapshot = await db.collection('states')
      .orderBy('geohash')
      .startAt(b[0])
      .endAt(b[1])
      .get();

    docs = docs.concat(snapshot.docs);
  }
  
  const value = docs.reduce((values, value) => ({ ...values, [value.id]: value.data() }), {});
  const values = Object.values(value || {})
    .filter((state) => state.time <= end && state.time >= begin)
    .sort((x, y) => {
      return x.time - y.time;
    });

  return values;
}

export async function lastState(icao24) {
  const database = firebase.app().firestore();
  const snapshot = await database
    .collection('states')
    .orderBy('time')
    .where('icao24', '==', icao24)
    .limitToLast(1)
    .get();
  const value = snapshot.docs.reduce((values, value) => ({ ...values, [value.id]: value.data() }), {});
  const values = Object.values(value || {});

  return values[0];
}

export async function getFlight(flightID) {
  const database = firebase.app().firestore();
  const snapshot = await database
    .collection('flights')
    .doc(flightID)
    .get();

  return snapshot.data();
}

export function states(coordinates, time, callback) {
  const line = turf.lineString(coordinates);
  const radius = turf.length(line, { units: 'kilometers' });
  const p = turf.center(turf.points(coordinates));
  const center = p.geometry.coordinates;
  const from = time || (new Date()).getTime() / 1000;
  const begin = Math.floor(from - (60 * 60 * 4));
  const end = Math.floor(from);
  const bounds = geohashQueryBounds(center, radius);
  const db = firebase.app().firestore();

  // const filterSnapshot = (snapshot) => {
  //   const matchingDocs = [];

  //   for (const snap of snapshots) {
  //     for (const doc of snap.docs) {
  //       const lat = doc.get('latitude');
  //       const lng = doc.get('longitude');
  //       const distanceInKm = distanceBetween([lat, lng], center);

  //       if (distanceInKm <= radius) {
  //         matchingDocs.push(doc.data());
  //       }
  //     }
  //   }

  //   return matchingDocs;
  // }

  const listeners = []

  for (const b of bounds) {
    const query = db.collection('states')
      .orderBy('geohash')
      .startAt(b[0])
      .endAt(b[1]);

    const unsubscribe = query
      .onSnapshot((snapshot) => {
        snapshot
          .docChanges()
          .forEach((change) => {
            const eventName = change.type === "added" ? "entered" : change.type === "removed" ? "exited" : "moved";
            const key = change.doc.id;
            const state = change.doc.data();
            const distance = distanceBetween([state.latitude, state.longitude], center);
            const isNew = state.time >= end;

            if (isNew) {
              history(key, begin, end)
                .then((history) => {
                  console.log(state);
                  console.log(state.callsign + " " + eventName + " query (" + distance.toFixed(2) + " km from center)");
                  callback(
                    eventName,
                    key,
                    state,
                    history
                  );
                })
                .catch(console.log);
            }
          });
      });

    listeners.push(unsubscribe);
  }  

  return () => {
    listeners.forEach(x => x());
  };
}

function hoveringTime(states, time, box) {
  const now = Math.floor(time || Date.now() / 1000);
  const filtered = states
    .filter((s) => turf.booleanWithin(turf.point([s.latitude, s.longitude]), box));
  const isHovering = filtered.length > 1;

  if (isHovering) {
    const recentStates = filtered
      .filter((s) => now - s.time < 7 * 60);

    if (recentStates.length > 0) {
      const hoverTime = now - filtered[0].time;

      return hoverTime;
    }
  }

  return null;
}

export function hoveringStates(location, radius, optionsOrCallback, callbackOrUndefined) {
  const callback = callbackOrUndefined || optionsOrCallback;
  const options = !callbackOrUndefined ? {} : optionsOrCallback;
  const point = turf.point([location.latitude, location.longitude]);
  const buffered = turf.circle(point, radius / 1000, { units: 'kilometers', steps: 8 });
  const box = turf.bboxPolygon(turf.square(turf.bbox(buffered)));
  const time = options.time;

  return states([[box.bbox[0], box.bbox[1]], [box.bbox[2], box.bbox[3]]], time, (event, icao24, state, history) => {
    if (!history) return;

    const isLanded = (Number(state.baro_altitude || state.gps_altitude) <= 0)
      && Number(state.vertical_rate) <= 0;
    const hoverTime = hoveringTime(history, time, box);

    if (!isLanded && hoverTime !== null) {
      callback(event, icao24, { hovering_time: hoverTime, ...state }, history);
    } else {
      console.log(state.callsign, "is not hovering", "hovering", hoverTime !== null, "landed", isLanded);
      callback("exited", icao24, state, history);
    }
  });
}

export async function hoveringHistory(location, radius, since) {
  const center = [Number(location.latitude), Number(location.longitude)];
  const bounds = geohashQueryBounds(center, radius);
  const db = firebase.app().firestore();
  const promises = [];

  for (const b of bounds) {
    const q = db.collection('hoverEvents')
      .orderBy('geohash')
      .startAt(b[0])
      .endAt(b[1]);

    promises.push(q.get());
  }

  const snapshots = await Promise.all(promises)
  const matchingDocs = [];

  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      if (doc.get('startTime') < since) {
        continue;
      }

      const lat = doc.get('latitude');
      const lng = doc.get('longitude');

      // We have to filter out a few false positives due to GeoHash
      // accuracy, but most will match
      const distanceInKm = distanceBetween([lat, lng], center);
      const distanceInM = distanceInKm * 1000;

      if (distanceInM <= radius) {
        matchingDocs.push(doc.data());
      }
    }
  }

  return matchingDocs;
}

export async function hoverEvents(icao24, since) {
  const db = firebase.app().firestore();
  let query = db.collection('hoverEvents')
    .orderBy('startTime');
  if (icao24) {
    query = query.where('icao24', '==', icao24);
  }
  if (since) {
    query = query.where('startTime', '>=', since);
  }
  const snapshot = await query.get();

  return snapshot.docs
    .map(x => x.data());
}
