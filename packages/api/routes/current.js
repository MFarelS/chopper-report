const { Router } = require('express');
const opensky = require('../lib/opensky');
const jetphotos = require('../lib/jetphotos');
const faa = require('../lib/faa');
const { map } = require('cheerio/lib/api/traversing');
const { acceptsCharsets } = require('express/lib/request');

async function getStates({ latitude, longitude, icao24, time }) {
  const { states } = await opensky.states({
    lat: latitude,
    lon: longitude,
    radius: 500,
    icao24,
    time,
  });

  const filteredStates = states
      .filter((state) => !state.on_ground);

  return filteredStates;
}

module.exports = () => {
  let router = Router();

  // GET /api/current
  router.get('/', async (req, res) => {
    const { latitude, longitude } = req.query;
    console.log(req.url);
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing latitude or longitude',
      });
    }
    
    try {
      const currentStates = await getStates({ latitude, longitude });
      // console.log(currentStates);
      const allStates = await Promise.all(Array.from(Array(12).keys())
        .map(async (i) => {
          const time = Math.floor(((new Date()).getTime() / 1000) - (i * 300));
          await new Promise(r => setTimeout(r, i * 100));
          console.log(`fetching states ${(i * 300) / 60} minutes ago`);
          const states = await getStates({ latitude, longitude, time });

          return states;
        }));

      const grouped = allStates.flat().reduce((acc, curr) => {
        acc[curr.icao24] = (acc[curr.icao24] || []).concat([curr]);
        return acc;
      }, {});
      const hoveringIcaos = Object.keys(grouped || {})
        .filter((icao24) => grouped[icao24].length > 1);

      const aircrafts = await Promise.all(hoveringIcaos
        .map(async (icao24) => {
          const states = grouped[icao24];
          const state = states[0];
          

          if (allStates.length === 0) {
            return null;
          }

          return {
            allStates: states,
            hovering_time: states.length * 300,
            ...state,
          };
        }));

      console.log("RETURNING", aircrafts);

      return res.json({ aircrafts });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        error: error.message,
      });
    }
  });

  return router;
}
