const turf = require('@turf/turf');
const geofire = require('geofire-common');
const polyline = require('@mapbox/polyline');
const _ = require('lodash');

module.exports = {
  getEvents: (states, options = {}) => {
    let allStates = Object.values(states);

    if (options.filter) {
      allStates = allStates.filter(options.filter);
    }

    const aircrafts = _.groupBy(allStates, 'icao24');
    const icaos = Object.keys(aircrafts);
    const allFlights = {};

    const getFlightID = (states) => {
      return `${states[0].icao24}:${states[0].time}:${states.slice(-1)[0].time}`;
    };

    const hoveringAircrafts = icaos.reduce((values, icao24) => {
      const states = aircrafts[icao24];

      // Group into flights
      const flights = states
        .reduce((values, value) => {
          if (values.length > 0) {
            let newValues = [...values];
            const lastValues = newValues.pop();
            const lastTime = lastValues.slice(-1)[0].time;

            // If less than 12 minutes have passed, it's part of the last flight
            if (value.time - lastTime < 60 * 12) {
              return [
                ...newValues,
                [
                  ...lastValues,
                  value,
                ],
              ];
            }
            // console.log('new flight', icao24, lastValues.slice(-1)[0], value);
          }

          return [
            ...values,
            [value],
          ];
        }, []);

      const clustered = flights
        .flatMap(states => {
          const stateClusters = states
            .reduce((values, value) => {
              if (values.length > 0) {
                let newValues = [...values];
                const lastValues = newValues.pop();
                const lastPoint = turf.center(turf.points(lastValues.map(value => [value.latitude, value.longitude])));
                const distance = turf.distance(lastPoint, turf.point([value.latitude, value.longitude]));

                if (distance < 2) {
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
            .filter(states => states.length > 3);

          return stateClusters
            .map((filtered) => ({
              states: filtered,
              flightStates: states,
            }))
        })
        .map(({ states, flightStates }) => {
          const points = turf.points(states.map(state => [state.latitude, state.longitude]));
          const center = turf.center(points);
          const meanVelocity = states.reduce((sum, state) => sum + state.velocity, 0) / states.length;
          const containsZeroAltitude = states.filter(state => state.baro_altitude < 0).length >= (states.length / 2);
          const diff = states.slice(-1)[0].time - states[0].time;

          if (meanVelocity > 38 || containsZeroAltitude || diff < 240) {
            return null;
          }

          const flightID = getFlightID(flightStates);
          if (!allFlights[flightID]) {
            allFlights[flightID] = {
              routePolyline: polyline.encode(flightStates.map(state => [state.latitude, state.longitude])),
              icao24: flightStates[0].icao24,
              startTime: flightStates[0].time,
              endTime: flightStates.slice(-1)[0].time,
            };
          }

          let result = {
            icao24: states[0].icao24,
            startTime: states[0].time,
            endTime: states.slice(-1)[0].time,
            hoverTime: states.slice(-1)[0].time - states[0].time,
            latitude: center.geometry.coordinates[0],
            longitude: center.geometry.coordinates[1],
            geohash: geofire.geohashForLocation(center.geometry.coordinates),
            flightID,
          };

          if (options.excludeStates !== true) {
            result.states = states;
          }

          return result;
        })
        .filter(event => event !== null);
      
      if (clustered.length > 0) {
        return {
          ...values,
          [icao24]: clustered,
        };
      } else {
        return values;
      }
    }, {});

    return {
      hoveringAircrafts,
      flights: allFlights,
    };
  },
};
