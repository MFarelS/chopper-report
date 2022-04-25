import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

function Splash() {

  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation
          .getCurrentPosition((position) => {
            console.log("Found location...");
            navigate(`/${position.coords.latitude.toFixed(5)}/${position.coords.longitude.toFixed(5)}/13`);
          });
      }
    } catch (error) {
      console.log(error);
    }
  }, [navigate]);

  return (
    <div className="splash">
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    </div>
  );
}

export default Splash;
