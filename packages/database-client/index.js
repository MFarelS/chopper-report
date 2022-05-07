import firebase from 'firebase/app';
import 'firebase/database';
import * as turf from "@turf/turf";
import { GeoFire } from 'geofire';

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
  const database = firebase.app().database();
  const ref = database.ref('aircrafts').child(icao24);
  const snapshot = await ref.once('value');
  const value = snapshot.val();

  return value;
}

export async function state(icao24, time) {
  const database = firebase.app().database();
  const snapshot = await database
    .ref('states')
    .orderByKey()
    .startAt(`${icao24}:`)
    .endAt(`${icao24}:\uf8ff`)
    .limitToLast(1)
    .once('value');
  const value = snapshot.val();
  const key = Object.keys(value)[0];

  return value[key];
}

export async function history(icao24, begin, end) {
  const database = firebase.app().database();
  const snapshot = await database
    .ref('states')
    .orderByKey()
    .startAt(`${icao24}:${begin}`)
    .endAt(`${icao24}:${end}`)
    .once('value');
  const value = snapshot.val();
  const values = Object.values(value || {})
    .sort((x, y) => {
      return x.time - y.time;
    });

  return values;
}

export function states(coordinates, time, callback) {
  const line = turf.lineString(coordinates);
  const l = turf.length(line, { units: 'kilometers' });
  const p = turf.center(turf.points(coordinates));
  const database = firebase.app().database();
  const states = database.ref('states');
  const geoFire = new GeoFire(database.ref('geofire'));
  const query = geoFire.query({
    center: p.geometry.coordinates,
    radius: l
  });
  const from = time || (new Date()).getTime() / 1000;
  const begin = Math.floor(from - (60 * 60 * 4));
  const end = Math.floor(from);

  const onKeyEnteredRegistration = query.on("key_entered", (key, location, distance) => {
    Promise
      .all([
        state(key),
        history(key, begin, end)
      ])
      .then(([state, history]) => {
        console.log(state.callsign + " entered query at " + location + " (" + distance.toFixed(2) + " km from center)");
        callback(
          "entered",
          key,
          state,
          history
        );
      })
      .catch(console.log);
  });

  const onKeyExitedRegistration = query.on("key_exited", (key, location, distance) => {
    Promise
      .all([
        state(key),
        history(key, begin, end)
      ])
      .then(([state, history]) => {
        console.log(state.callsign + " exited query to " + location + " (" + distance.toFixed(2) + " km from center)");
        callback(
          "exited",
          key,
          state,
          history
        );
      })
      .catch(console.log);
  });

  const onKeyMovedRegistration = query.on("key_moved", (key, location, distance) => {
    Promise
      .all([
        state(key),
        history(key, begin, end)
      ])
      .then(([state, history]) => {
        console.log(state.callsign + " moved within query to " + location + " (" + distance.toFixed(2) + " km from center)");
        callback(
          "moved",
          key,
          state,
          history
        );
      })
      .catch(console.log);
  });

  return () => {
    onKeyEnteredRegistration.cancel();
    onKeyExitedRegistration.cancel();
    onKeyMovedRegistration.cancel();
  };
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

    const now = Math.floor(time || Date.now() / 1000);
    const filtered = history
      .filter((s) => turf.booleanWithin(turf.point([s.latitude, s.longitude]), box));
    const isHovering = filtered.length > 1;
    const isLanded = (Number(state.baro_altitude || state.gps_altitude) <= 0)
      && Number(state.vertical_rate) <= 0;

    if (isHovering && !isLanded) {
      const recentStates = filtered
        .filter((s) => now - s.time < 7 * 60);

      if (recentStates.length > 0) {
        const hoverTime = now - filtered[0].time;

        callback(event, icao24, { hovering_time: hoverTime, ...state }, history);
        return;
      }
    } else {
      console.log(state.callsign, "is not hovering", "hovering", isHovering, "landed", isLanded);
    }

    callback("exited", icao24, state, history);
  });
}
