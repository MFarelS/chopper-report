const { opensky } = require('@chopper-report/utils');
const database = require('@chopper-report/database');

module.exports = {
  run: async (database) => {
    const { time, states } = await opensky.states({
      lamin: process.env.LATITUDE_MIN,
      lamax: process.env.LATITUDE_MAX,
      lomin: process.env.LONGITUDE_MIN,
      lomax: process.env.LONGITUDE_MAX,
    });
    const results = (states || [])
      .filter((state) => state.on_ground !== true)
      .map((state) => {
        return {
          icao24: state.icao24,
          callsign: state.callsign,
          time: time,
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

    await database.writeStates(database, results);
  },
};
