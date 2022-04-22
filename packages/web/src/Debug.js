import { useRef } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

function Debug({ api, onSetLocation, onReload }) {

  const coordinatesRef = useRef(null);
  const icao24Ref = useRef(null);

  const updateCoordinates = (event) => {
    const value = event.target.value;

    if (value.indexOf(',') > -1) {
      const parts = value.split(',').map((x) => x.trim());

      if (parts.length === 2) {
        onSetLocation({ latitude: parseFloat(parts[0]), longitude: parseFloat(parts[1]) });
      }
    }
  };

  const updateCallsign = (event) => {
    try {
      (async () => {
        const value = event.target.value;

        if (value && value.length > 0) {
          const aircraft = await api.aircraft({ icao24: value });
          onSetLocation({ latitude: aircraft.latitude, longitude: aircraft.longitude });
        }
      })();
    } catch (error) {
      console.log(error);
    }
  };

  const onClickedReload = (event) => {
    if (coordinatesRef.current && (coordinatesRef.current.value || '').length > 0) {
      onSetLocation({ latitude: 0, longitude: 0 });
      onReload();
      updateCoordinates({ target: coordinatesRef.current });
    } else if (icao24Ref.current && (icao24Ref.current.value || '').length > 0) {
      onSetLocation({ latitude: 0, longitude: 0 });
      onReload();
      updateCallsign({ target: icao24Ref.current });
    } else {
      onReload();
    }
  }

  return (
    <div className="debug-panel">
      <TextField
        inputRef={coordinatesRef}
        id="coordinates"
        label="Coordinates"
        variant="standard"
        onChange={updateCoordinates} />
      <TextField
        inputRef={icao24Ref}
        id="icao24"
        label="icao24"
        variant="standard"
        onChange={updateCallsign} />
      <Button variant="text" onClick={onClickedReload}>Reload</Button>
    </div>
  );
}

export default Debug;
