import { MapContainer } from 'react-leaflet';
import Aircrafts from './Aircrafts';
import HoverHistory from './HoverHistory';
import Map from './Map';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from "react-router-dom";
import * as turf from '@turf/turf';

function HomeAtTime({ api, debug, options, setOption }) {

  const [search] = useSearchParams();
  const [aircraft, setAircraft] = useState(null);
  const [historyAircraft, setHistoryAircraft] = useState(null);
  const [location, setLocation] = useState({ latitude: 40.7639, longitude: -73.9794 });
  const { icao24, zoom } = useParams();

  const time = search.get('time');

  useEffect(() => {
    console.log('Loading...');

    if (time && time > 0) {
      const begin = Math.floor(time - (60 * 60 * 3));
      const end = Math.floor(time);

      Promise
        .all([
          api.history(icao24.toLowerCase(), begin, end),
          api.metadata({ icao24: icao24.toLowerCase() }),
        ])
        .then(([history, metadata]) => {
          const state = history[history.length - 1];
          const point = turf.point([state.latitude, state.longitude]);
          const buffered = turf.circle(point, 1.5, { units: 'kilometers', steps: 8 });
          const box = turf.bboxPolygon(turf.square(turf.bbox(buffered)));
          const filtered = history
            .filter((s) => turf.booleanWithin(turf.point([s.latitude, s.longitude]), box));
          const hoverTime = (time || Math.floor(Date.now() / 1000)) - filtered[0].time;

          setAircraft({
            state: {
              ...state,
              hovering_time: hoverTime,
            },
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
    }
  }, [icao24, time, api]);

  console.log('homeattime')

  return (
    <div id="map" className="map">
      {aircraft && aircraft.state && <MapContainer className="map-container" boundsOptions={{ paddingBottomRight: [0, -100] }} center={[aircraft.state.latitude, aircraft.state.longitude]} zoom={zoom}>
        <Map
          location={{latitude: aircraft.state.latitude, longitude: aircraft.state.longitude}}
          options={options}
          setSelectedIcao24={() => console.log('noop')}
          selectedIcao24={aircraft.state.icao24}
          aircrafts={{[aircraft.state.icao24]: aircraft}} />
      </MapContainer>}
      {location && <MapContainer className="map-container" boundsOptions={{ paddingBottomRight: [0, -100] }} center={[location.latitude, location.longitude]} zoom={zoom}>
        <Map
          location={location}
          options={options}
          setSelectedIcao24={() => console.log('noop')}
          selectedIcao24={icao24}
          aircrafts={historyAircraft} />
      </MapContainer>}
      {aircraft && aircraft.state && <Aircrafts
        debug={debug}
        api={api}
        radius={1500}
        allIcao24s={[aircraft.state.icao24]}
        options={options}
        setLocation={setLocation}
        setSelectedIcao24={() => console.log('noop')}
        selectedIcao24={aircraft.state.icao24}
        location={{latitude: aircraft.state.latitude, longitude: aircraft.state.longitude}}
        aircrafts={{[aircraft.state.icao24]: aircraft}} />}
      {!time && <div className="aircraft-panel-container">
        <div className="aircraft-panel">
          <HoverHistory api={api} icao24={icao24} setLocation={setLocation} setHistoryAircraft={setHistoryAircraft} />
        </div>
      </div>}
    </div>
  );
}

export default HomeAtTime;
