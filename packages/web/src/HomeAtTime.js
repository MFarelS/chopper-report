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
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

function HomeAtTime({ api, debug, options, setOption }) {

  const [search, setSearch] = useSearchParams();
  const [aircraft, setAircraft] = useState(null);
  const { icao24, zoom } = useParams();

  const time = search.get('time');

  useEffect(() => {
    console.log('Loading...');

    const begin = Math.floor(time - (60 * 60 * 3));
    const end = Math.floor(time);
    Promise
      .all([
        api.history(icao24, begin, end),
        api.metadata({ icao24 }),
      ])
      .then(([history, metadata]) => {
        const state = history[history.length - 1];

        setAircraft({
          state,
          history,
          metadata,
          distance: 0,
          recentHistory: history.filter(h => h.time * 1000 > time - 1000 * 60 * 60 * 1),
          isHelicopter: () => {
            return metadata.icaoAircraftClass.startsWith("H")
              || metadata.manufacturer.split(" ").indexOf("Bell") > -1
              || metadata.manufacturer.split(" ").indexOf("Robinson") > -1;
          },
        });
      })
      .catch(console.log);
  }, [icao24, time]);

  return (
    <Grid className="container" container spacing={2}>
      {aircraft && <Grid item xs={5}>
        <div id="map" className="map">
          <MapContainer className="map-container" center={[aircraft.state.latitude, aircraft.state.longitude]} zoom={zoom}>
            <Map
              location={{latitude: aircraft.state.latitude, longitude: aircraft.state.longitude}}
              options={options}
              setSelectedIcao24={() => console.log('noop')}
              selectedIcao24={aircraft.state.icao24}
              aircrafts={{[aircraft.state.icao24]: aircraft}} />
          </MapContainer>
        </div>
      </Grid>}
      {aircraft && <Grid item xs={7}>
        <Aircrafts
          debug={debug}
          api={api}
          allIcao24s={[aircraft.state.icao24]}
          options={options}
          setSelectedIcao24={() => console.log('noop')}
          selectedIcao24={aircraft.state.icao24}
          location={{latitude: aircraft.state.latitude, longitude: aircraft.state.longitude}}
          aircrafts={{[aircraft.state.icao24]: aircraft}} />
      </Grid>}
    </Grid>
  );
}

export default HomeAtTime;
