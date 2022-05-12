const turf = require('@turf/turf');
const geofire = require('geofire-common');

module.exports = {
  getEvents: (states, options = {}) => {
    let allStates = Object.values(states);

    if (options.filter) {
      allStates = allStates.filter(options.filter);
    }

    const aircrafts = allStates
      .reduce((values, value) => ({ ...values, [value.icao24]: [ ...(values[value.icao24] || []), value] }), {});

    const icaos = Object.keys(aircrafts);
    const hoveringAircrafts = icaos.reduce((values, icao24) => {
      const states = aircrafts[icao24];
      const clustered = states
        .filter(x => x.velocity < 23)
        .reduce((values, value) => {
          if (values.length > 0) {
            let newValues = [...values];
            const lastValues = newValues.pop();
            const lastTime = lastValues.slice(-1)[0].time;

            if (value.time - lastTime < 60 * 12) {
              return [
                ...newValues,
                [
                  ...lastValues,
                  value,
                ],
              ];
            }
          }

          return [
            ...values,
            [value],
          ];
        }, [])
        .filter(x => x.length > 3)
        .map(states => {
          const points = states.map(({ latitude, longitude }) => [latitude, longitude]);
          const center = turf.center(turf.points(points));

          let result = {
            startTime: states[0].time,
            endTime: states.slice(-1)[0].time,
            hoverTime: states.slice(-1)[0].time - states[0].time,
            latitude: center.geometry.coordinates[0],
            longitude: center.geometry.coordinates[1],
            geohash: geofire.geohashForLocation(center.geometry.coordinates),
          };

          if (options.excludeStates !== true) {
            result.states = states;
          }

          return result;
        });
      
      if (clustered.length > 0) {
        return {
          ...values,
          [icao24]: clustered,
        };
      } else {
        return values;
      }
    }, {});

    return hoveringAircrafts;
  },
};
