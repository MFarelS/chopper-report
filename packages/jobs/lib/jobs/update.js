const { opensky } = require('@chopper-report/utils');
const database = require('@chopper-report/database-admin');

module.exports = {
  run: async () => {
    console.log('[JOBS/update] Updating states...');
    const { time, states } = await opensky.states({
      lamin: process.env.LATITUDE_MIN,
      lamax: process.env.LATITUDE_MAX,
      lomin: process.env.LONGITUDE_MIN,
      lomax: process.env.LONGITUDE_MAX,
    });
    console.log('[JOBS/update] Found', (states || []).length, 'states.');
    const results = (states || [])
      .filter((state) => state.on_ground !== true && state.icao24 !== null && state.icao24 !== undefined && state.icao24 !== '')
      .map((state) => {
        return {
          icao24: state.icao24.trim(),
          callsign: state.callsign.trim(),
          time: state.last_contact,
          last_contact: state.last_contact,
          longitude: state.longitude,
          latitude: state.latitude,
          baro_altitude: state.baro_altitude,
          velocity: state.velocity,
          true_track: state.true_track,
          vertical_rate: state.vertical_rate,
          gps_altitude: state.geo_altitude,
          squawk: state.squawk,
        };
      });

    await database.writeStates(results);
  },
};
