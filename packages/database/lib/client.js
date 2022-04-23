import { initializeApp, getApp } from '@firebase/app';
import { getDatabase } from "@firebase/database";
import bbox from '@turf/bbox';
import circle from '@turf/circle';
import square from '@turf/square';
import { polygon } from '@turf/helpers';
import { GeoFire } from 'geofire';

module.exports = {
  initialize: () => {
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      databaseURL: `https://${process.env.REACT_APP_FIREBASE_DATABASE_NAME}.firebaseio.com`,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };

    initializeApp(firebaseConfig);
  },
  states: (ref, { lamin, lamax, lomin, lomax }, callback) => {
    const box = polygon([lamin, lomin], [lamin, lomax], [lamax, lomax], [lamax, lomin]);
    console.log(box);
  },
};