import './Map.css';

import { TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import { divIcon } from "leaflet";
import { renderToString } from "react-dom/server";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlane, faHelicopter, faLocationArrow } from '@fortawesome/free-solid-svg-icons'
import { useEffect } from 'react';
import * as turf from "@turf/turf";
import { useParams } from "react-router-dom";
import Button from 'react-bootstrap/Button';

function Map({ location, options, aircrafts, setSelectedIcao24, selectedIcao24, onClick }) {

  const { zoom } = useParams();

  const map = useMapEvents({
    click: (event) => {
      if (event.containerPoint.y <= 40 && event.containerPoint.x - event.target._size.x <= 40) {
        return;
      }
      onClick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
    locationfound: ({ latlng }) => {
      onClick({ latitude: latlng.lat, longitude: latlng.lng, zoom: 15 });
    },
    zoomend: ({ target }) => {
      const currentPath = window.location.pathname + window.location.search;
      let path = `/${Number(location.latitude).toFixed(5)}/${Number(location.longitude).toFixed(5)}/${target.getZoom().toFixed(0)}`;
      
      if (currentPath.split('/').length === 3) {
        path = `/${selectedIcao24}/${target.getZoom().toFixed(0)}`;
      }
      if (currentPath.indexOf('time=') > -1) {
        path += `?time=${currentPath.split('time=')[1].split('&').slice(-1)[0]}`;
      }
      
      if (path !== currentPath) {
        window.history.replaceState(null, null, path)
      }
    },
  });

  useEffect(() => {
    map.flyTo([location.latitude, location.longitude]);
  }, [location, map]);

  const onLocate = () => {
    map.locate();
  };

  let makePlaneIcon = (aircraft, isSelected) => {
    const iconMarkup = renderToString(
      <FontAwesomeIcon icon={faPlane} style={{ transform: `rotate(${aircraft.true_track - 90}deg)` }} />
    );
    const planeIcon = divIcon({
      html: iconMarkup,
      className: `plane-icon${isSelected ? ' plane-icon-active' : ''}`
    });

    return planeIcon;
  }

  let makeChopperIcon = (aircraft, isSelected) => {
    const iconMarkup = renderToString(
      <FontAwesomeIcon icon={faHelicopter} />
    );
    const icon = divIcon({
      html: iconMarkup,
      className: `plane-icon${isSelected ? ' plane-icon-active' : ''}`
    });

    return icon;
  }

  const iconMarkup = renderToString(
    <div class='current-location' />
  );
  const circleIcon = divIcon({
    html: iconMarkup,
    className: 'current-location-outer'
  });

  const debugLabels = options.showStateInfo === false ? [] : ((aircrafts[selectedIcao24] || {})
    .history || [])
    .map(({ latitude, longitude, baro_altitude, speed, vertical_rate, callsign, time }) => {
      const iconMarkup = renderToString(
        <div class='debug-label'>
          <div class='debug-label-title'>{callsign}</div>
          <div class='debug-label-value'>{`${latitude.toFixed(4)}, ${longitude.toFixed(4)}, ${(baro_altitude || 0).toFixed(0)}`}</div>
          <div class='debug-label-value'>{`${(speed || 0).toFixed(0)}kt, ${vertical_rate.toFixed(0)}fpm`}</div>
          <div class='debug-label-value'>{`${new Date(time).toLocaleString()}`}</div>
        </div>
      );
      const icon = divIcon({
        html: iconMarkup,
        className: 'debug-label-outer'
      });
      
      return (
        <Marker key={time} position={[latitude, longitude]} icon={icon} >
          <Popup>{`${location.latitude}, ${location.longitude}`}</Popup>
        </Marker>
      );
    });

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={`https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`}
      />
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control leaflet-bar">
          <Button className="locate-button" onClick={() => onLocate()}>
            <FontAwesomeIcon icon={faLocationArrow} />
          </Button>
        </div>
      </div>

      {options.showRadius && <Circle className="radius-circle" key="radius" radius={1500} center={[location.latitude, location.longitude]} />}
      <Marker key="current-location" position={[location.latitude, location.longitude]} icon={circleIcon} >
        <Popup>{`${location.latitude}, ${location.longitude}`}</Popup>
      </Marker>
      {debugLabels}
      {aircrafts && Object.keys(aircrafts).map((icao24) => {
        const { state, recentHistory, isHelicopter } = aircrafts[icao24];
        const isSelected = icao24 === selectedIcao24;
        const icon = isHelicopter() ? makeChopperIcon(state, isSelected) : makePlaneIcon(state, isSelected);
        const position = [state.latitude, state.longitude];
        const positions = recentHistory.map((s) => [s.latitude, s.longitude]) || [];
        const adjusted = positions.length > 0 ? turf.bezierSpline(turf.lineString(positions), {
          sharpness: 0.95,
          resolution: 50000,
        }).geometry.coordinates : [];

        return (
          <div key={icao24}>
          <Marker key={`${icao24}:${state.latitude}:${state.longitude}`} position={position} icon={icon} />
          {isSelected && <Polyline className="route-line" key={`${icao24}:polyline`} positions={adjusted} />}
          {isSelected && recentHistory.map((state) => (
            <Circle key={`${icao24}:${state.time}`} radius={4} center={position} />
          ))}
          </div>
        );
      })}
    </>
  );
}

export default Map;
