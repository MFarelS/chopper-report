import './Map.css';

import { TileLayer, Marker, Popup, useMapEvent } from 'react-leaflet';
import { divIcon } from "leaflet";
import { renderToString } from "react-dom/server";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlane, faHelicopter } from '@fortawesome/free-solid-svg-icons'

function Map({ location, aircrafts, selectedIndex, onClick }) {

  const map = useMapEvent('click', ({ latlng }) => {
    onClick({ latitude: latlng.lat, longitude: latlng.lng });
  });

  let makePlaneIcon = (aircraft, isSelected) => {
    const iconMarkup = renderToString(
      <FontAwesomeIcon icon={faPlane} style={{ transform: `rotate(${aircraft.true_track}deg)` }} />
    );
    const planeIcon = divIcon({
      html: iconMarkup,
      className: `plane-icon${isSelected ? ' accent' : ''}`
    });

    return planeIcon;
  }

  let makeChopperIcon = (aircraft, isSelected) => {
    const iconMarkup = renderToString(
      <FontAwesomeIcon icon={faHelicopter} style={{ transform: `rotate(${aircraft.true_track}deg)` }} />
    );
    const icon = divIcon({
      html: iconMarkup,
      className: `plane-icon${isSelected ? ' accent' : ''}`
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

  map.flyTo([location.latitude, location.longitude]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={`https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`}
      />

      <Marker key="current-location" position={[location.latitude, location.longitude]} icon={circleIcon} >
        <Popup>{`${location.latitude}, ${location.longitude}`}</Popup>
      </Marker>
      {aircrafts && aircrafts.map((aircraft, index) => (
        <Marker key={aircraft.icao24} position={[aircraft.latitude, aircraft.longitude]} icon={true ? makeChopperIcon(aircraft, index === selectedIndex) : makePlaneIcon(aircraft, index === selectedIndex)} />
      ))}
    </>
  );
}

export default Map;
