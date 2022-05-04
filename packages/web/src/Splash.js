import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Spinner } from 'react-bootstrap';

function Splash() {

  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation
          .getCurrentPosition((position) => {
            console.log("Found location...");
            navigate(`/${position.coords.latitude.toFixed(5)}/${position.coords.longitude.toFixed(5)}/15`);
          });
      }
    } catch (error) {
      console.log(error);
    }
  }, [navigate]);

  return (
    <div className="splash">
      <Spinner animation="border" />
    </div>
  );
}

export default Splash;
