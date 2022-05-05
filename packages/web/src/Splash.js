import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { MapContainer } from 'react-leaflet';
import Map from './Map';

function Splash() {

  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation
          .getCurrentPosition((position) => {
            console.log("Found location...");
            // navigate(`/${position.coords.latitude.toFixed(5)}/${position.coords.longitude.toFixed(5)}/15`);
          });
      }
    } catch (error) {
      console.log(error);
    }
  }, [navigate]);

  return (
    <div className="splash">
      <MapContainer className="map-container">
        <Map
          options={{}} />
      </MapContainer>
    </div>
  );
}

export default Splash;
