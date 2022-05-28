import { MapContainer } from 'react-leaflet';
import Aircrafts from './Aircrafts';
import Map from './Map';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getFlightPathPrediction, distance } from './lib/helpers';
import * as moment from 'moment';
import * as _ from 'lodash';

function Home({ api, options, setOption }) {

  const [search] = useSearchParams();
  const [state, setState] = useState({
    aircrafts: {},
    selectedIcao24: null,
    allIcao24s: [],
    hoverEvents: [],
  });
  const [cancellation, setCancellation] = useState(null);
  const [interval, setUpdateInterval] = useState(null);
  const [aircraftsOverride, setAircraftsOverride] = useState(null);
  const [mapLocation, setMapLocation] = useState(null);
  const { lat, lon, zoom } = useParams();
  const navigate = useNavigate();

  const location = useMemo(() => ({ latitude: Number(lat), longitude: Number(lon) }), [Number(lat), Number(lon)]);
  const steps = 300;
  const duration = 60; // in seconds
  const showAll = false;
  const statesFunction = showAll ? api.allStates : api.states;
  const radius = showAll ? 5000: 1500;
  const hasLocation = lat !== undefined && lon !== undefined;

  useEffect(() => {
    if (!hasLocation) {
      return;
    }
    console.log('Updating...');
    if (cancellation) {
      cancellation();
    }
    setState({
      aircrafts: {},
      selectedIcao24: null,
      allIcao24s: [],
      hoverEvents: [],
    });
    if (options?.time) {
      const now = options.time;
      const begin = Math.floor(now - (60 * 60 * 4));
      const end = Math.floor(now);
      console.log('loading at', now);

      api
        .historicStates([Number(lat), Number(lon)], radius, begin, end)
        .then((allStates) => {
          const grouped = Object.values(_.groupBy(allStates, 'time')).sort((a, b) => a[0].time - b[0].time);
          const waitUntilNextStates = async (states) => {
            const next = states.pop();
            console.log('next', next);
            const icaos = [...new Set(next.map(state => state.icao24))];
            const historys = _.groupBy(await Promise.all(icaos.map(icao24 => api.history(icao24, begin, end))), 'icao24');
            const metadatas = _.groupBy(await Promise.all(icaos.map(icao24 => api.metadata({ icao24 }))), 'icao24');
            console.log('next state in', moment.duration((next[0].time - now) * 1000).humanize());
            const timeout = setTimeout(() => {
              (async () => {
                try {
                  setState((oldState) => {
                    for (let i = 0; i < next.length; i += 1) {
                      const metadata = metadatas[state.icao24][0];
                      const history = historys[state.icao24][0];
                      const state = history.slice(-1)[0];
                      oldState.aircrafts[state.icao24] = {
                        state,
                        history,
                        metadata,
                        distance: distance(lat, lon, state.latitude, state.longitude),
                        recentHistory: history.filter(h => h.time > now - 60 * 60 * 1),
                        predictions: getFlightPathPrediction(
                          [state.longitude, state.latitude],
                          state.velocity,
                          duration,
                          state.true_track,
                          steps
                        ),
                        isHelicopter: () => {
                          return (metadata.icaoAircraftClass || "").startsWith("H")
                            || (metadata.manufacturer || "").split(" ").indexOf("Bell") > -1
                            || (metadata.manufacturer || "").split(" ").indexOf("Robinson") > -1
                            || (metadata.manufacturer || "").indexOf("Helicopter") > -1;
                        },
                      };
                    }

                    return {
                      ...oldState,
                    };
                  });

                  await waitUntilNextStates(states);
                } catch (error) {
                  console.log(error);
                }
              })();
            }, (next[0].time - now) * 1000);

            setCancellation(() => {
              clearTimeout(timeout);
            });
          };

          (async () => {
            try {
              await waitUntilNextStates(grouped);
            } catch (error) {
              console.log(error);
            }
          })();
        })
        .catch(console.log);
    } else {
      const cancel = statesFunction.call(api, location, radius, options.time || search.get('time'), (event, icao24, state, metadata, history) => {
        setState(oldState => {
          switch (event) {
            case 'entered':
            case 'moved':
              oldState.aircrafts[icao24] = {
                state,
                history,
                metadata,
                distance: distance(lat, lon, state.latitude, state.longitude),
                recentHistory: history.filter(h => h.time * 1000 > Date.now() - 1000 * 60 * 60 * 1),
                predictions: getFlightPathPrediction(
                  [state.longitude, state.latitude],
                  state.velocity,
                  duration,
                  state.true_track,
                  steps
                ),
                isHelicopter: () => {
                  return (metadata.icaoAircraftClass || "").startsWith("H")
                    || (metadata.manufacturer || "").split(" ").indexOf("Bell") > -1
                    || (metadata.manufacturer || "").split(" ").indexOf("Robinson") > -1
                    || (metadata.manufacturer || "").indexOf("Helicopter") > -1;
                },
              };
              break;
            case 'exited':
              delete oldState.aircrafts[icao24];
              break;
            default:
              break;
          }
          oldState.allIcao24s = Object.keys(oldState.aircrafts)
            .sort((a, b) => {
              if (a < b) { return -1; }
              if (a > b) { return 1; }

              return 0;
            });

          if (!oldState.selectedIcao24 || oldState.allIcao24s.indexOf(oldState.selectedIcao24) < 0) {
            oldState.selectedIcao24 = oldState.allIcao24s[0];
          }

          return {
            ...oldState
          }
        });
      });
      setCancellation(cancel);

      console.log('[Home]', 'Loading hover events');

      const start = (options.time ? moment.unix(options.time) : moment()).subtract(7, 'days');
      api.hoveringHistory(location, 1500, start.unix())
        .then((history) => {
          console.log('[Home]', 'Loaded hover events');
          setState(state => ({
            ...state,
            hoverEvents: history,
            startTime: start,
          }));
        })
        .catch(console.log);
    }
  }, [hasLocation, lat, lon, api, cancellation, location, search, radius, statesFunction, options]);

  useEffect(() => {
    if (!hasLocation || state.allIcao24s.length === 0) {
      return;
    }
    if (interval) {
      window.clearInterval(interval);
    }

    let counter = 0;

    setUpdateInterval(window.setInterval(() => {
      if (counter < steps) {
        setState(state => {
          const updatedAircrafts = Object.keys(state.aircrafts).reduce((acc, icao24) => {
            const aircraft = state.aircrafts[icao24];
            const step = aircraft.predictions;
            if (step && step[counter]) {
              return {
                ...acc,
                [icao24]: {
                  ...aircraft,
                  state: {
                    ...aircraft.state,
                    longitude: step[counter].geometry.coordinates[0],
                    latitude: step[counter].geometry.coordinates[1]
                  }
                }
              };
            } else {
              return {
                ...acc,
                [icao24]: aircraft,
              };
            }
          }, {});

          return { ...state, aircrafts: updatedAircrafts }
        });

        counter++;
      } else {
        window.clearInterval(interval);
      }
    }, (1000 * duration) / steps));
  // eslint-disable-next-line
  }, [hasLocation]);


  return (
    <div id="map" className="map">
      <MapContainer className="map-container" center={hasLocation ? (mapLocation ? [mapLocation.latitude, mapLocation.longitude] : [lat, lon]) : [40.7128, -74.0060]} zoom={zoom || 13}>
        <Map
          onClick={(location) => {
            setMapLocation(null);
            let path = `/${Number(location.latitude).toFixed(5)}/${Number(location.longitude).toFixed(5)}/${location.zoom || Number(zoom).toFixed(0)}`;
            
            const time = search.get('time');
            if (time && time !== '') {
              path += `?time=${time}`;
            }
            if (search.get('d') === '1') {
              if (path.indexOf('?') > -1) {
                path += `&d=$1`;
              } else {
                path += `?d=$1`;
              }
            }
            
            navigate(path);
          }}
          boundsOptions={{
            paddingBottomRight: [333, 333],
          }}
          api={api}
          location={hasLocation ? (mapLocation || location) : null}
          options={options}
          hoverEvents={state.hoverEvents}
          setSelectedIcao24={(value) => setState(state => ({ ...state, selectedIcao24: value }))}
          selectedIcao24={state.selectedIcao24}
          aircrafts={aircraftsOverride || state.aircrafts} />
      </MapContainer>
      <div>
        <Aircrafts
          debug={false}
          api={api}
          radius={radius}
          allIcao24s={state.allIcao24s}
          setLocation={setMapLocation}
          options={options}
          hoverEvents={state.hoverEvents}
          startTime={state.startTime}
          setAircraftsOverride={setAircraftsOverride}
          setSelectedIcao24={(value) => setState(state => ({ ...state, selectedIcao24: value }))}
          selectedIcao24={state.selectedIcao24}
          location={hasLocation ? location : { latitude: 40.7128, longitude: -74.0060 }}
          aircrafts={state.aircrafts} />
      </div>
    </div>
  );
}

export default Home;
