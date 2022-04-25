import Grid from '@mui/material/Grid';
import { MapContainer } from 'react-leaflet';
import Aircrafts from './Aircrafts';
import Map from './Map';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from "react-router-dom";

function HomeAtTime({ api, debug, options, setOption }) {

  const [search] = useSearchParams();
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
  }, [icao24, time, api]);

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
