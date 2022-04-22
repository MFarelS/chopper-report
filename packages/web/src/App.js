import './App.css';
import Map from './Map';
import Aircrafts from './Aircrafts';
import Debug from './Debug';
import { withAPI } from './API';
import { useState, useEffect, useRef } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { MapContainer } from 'react-leaflet';
import Konami from 'react-konami-code';

const defaultLocation = { latitude: 40.7128, longitude: -74.0060 };

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

function App(props) {

  const [location, setLocation] = useState(defaultLocation);
  const [aircrafts, setAircrafts] = useState([]);
  const [debug, setDebug] = useState(false);

  const reload = () => {
    try {
      (async () => {
        console.log("fetching aircraft...");
        setAircrafts(await props.api.current(location));
      })();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (aircrafts.length === 0 && location) {
      reload();
    }
  }, [location]);

  useEffect(() => {
    try {
      if (navigator.geolocation && (!location || location === defaultLocation)) {
        navigator.geolocation
          .getCurrentPosition((position) => {
            setAircrafts([]);
            const dist = distance(location.latitude, location.longitude, position.coords.latitude, position.coords.longitude);
            if (dist > 0.15) {
              setLocation(position.coords);
            }
          });
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  return (
    <div className="app">
      <header>
        <Typography style={{ fontWeight: 500 }} variant="h5" component="h4">
          <span className="accent">whats</span>hovering<span className="accent">over</span>.me
        </Typography>
        <Konami action={() => setDebug(true)}>
          <Debug
            api={props.api}
            onReload={reload}
            onSetLocation={setLocation} />
        </Konami>
      </header>
      <Grid className="container" container spacing={2}>
        <Grid item xs={5}>
          <div id="map" className="map">
            <MapContainer className="map-container" center={[location.latitude, location.longitude]} zoom={15}>
              <Map onClick={(location) => !debug || setLocation(location)} location={location} aircrafts={aircrafts} />
            </MapContainer>
          </div>
        </Grid>
        <Grid item xs={7}>
          <Aircrafts api={props.api} location={location} aircrafts={aircrafts || []} />
        </Grid>
      </Grid>
      <footer>
        <Typography variant="body1" component="span">By Evan Coleman</Typography>
      </footer>
    </div>
  );
}

export default withAPI(App);
