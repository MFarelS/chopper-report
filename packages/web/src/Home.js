import Grid from '@mui/material/Grid';
import { MapContainer } from 'react-leaflet';
import Aircrafts from './Aircrafts';
import Map from './Map';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getFlightPathPrediction } from './lib/helpers';

function toRad(value) {
  return value * Math.PI / 180;
}

function distance(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

function Home({ api, debug, options, setOption }) {

  const radius = 1500;
  const [search] = useSearchParams();
  const [state, setState] = useState({
    aircrafts: {},
    selectedIcao24: null,
    allIcao24s: [],
  });
  const [cancellation, setCancellation] = useState(null);
  const interval = useRef(0);
  const { lat, lon, zoom } = useParams();
  const navigate = useNavigate();

  const location = { latitude: lat, longitude: lon };
  const steps = 50;
  const duration = 10; // in seconds

  useEffect(() => {
    console.log('Updating...');
    if (cancellation) {
      cancellation();
    }
    setState({
      aircrafts: {},
      selectedIcao24: null,
      allIcao24s: [],
    });
    const cancel = api.states(location, radius, search.get('time'), (event, icao24, state, metadata, history) => {
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
                return metadata.icaoAircraftClass.startsWith("H")
                  || metadata.manufacturer.split(" ").indexOf("Bell") > -1
                  || metadata.manufacturer.split(" ").indexOf("Robinson") > -1;
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
        oldState.selectedIcao24 = oldState.allIcao24s[0];

        return {
          ...oldState
        }
      });
    });
    setCancellation(cancel);
  }, [lat, lon, api, cancellation, location, search]);

  useEffect(() => {
    if (interval.current) {
      window.clearInterval(interval.current);
    }

    let counter = 0;

    interval.current = window.setInterval(() => {
      if (counter < steps) {
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
            return acc;
          }
        }, {});
        setState(state => ({ ...state, aircrafts: updatedAircrafts }));

        counter++;
      } else {
        window.clearInterval(interval.current);
      }
    }, (1000 * duration) / steps);
  }, [state.aircrafts]);

  return (
    <Grid className="container" container spacing={2}>
      <Grid item xs={5}>
        <div id="map" className="map">
          <MapContainer className="map-container" center={[lat, lon]} zoom={zoom}>
            <Map
              onClick={(location) => {
                let path = `/${Number(location.latitude).toFixed(5)}/${Number(location.longitude).toFixed(5)}/${location.zoom || Number(zoom).toFixed(0)}`;
                
                const time = search.get('time');
                if (time && time !== '') {
                  path += `?time=${time}`;
                }
                
                navigate(path);
              }}
              location={location}
              options={options}
              setSelectedIcao24={(value) => setState(state => ({ ...state, selectedIcao24: value }))}
              selectedIcao24={state.selectedIcao24}
              aircrafts={state.aircrafts} />
          </MapContainer>
        </div>
      </Grid>
      <Grid item xs={7}>
        <Aircrafts
          debug={debug}
          api={api}
          allIcao24s={state.allIcao24s}
          options={options}
          setSelectedIcao24={(value) => setState(state => ({ ...state, selectedIcao24: value }))}
          selectedIcao24={state.selectedIcao24}
          location={location}
          aircrafts={state.aircrafts} />
      </Grid>
    </Grid>
  );
}

export default Home;
