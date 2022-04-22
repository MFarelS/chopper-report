import './Aircraft.css';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import * as moment from 'moment';
import { useState, useEffect } from 'react';

function Aircraft({ api, location, state, setModalImage }) {

  const [aircraft, setAircraft] = useState(null);

  useEffect(() => {
    try {
      (async () => {
        if (aircraft === null) {
          const metadata = await api.metadata({ icao24: state.icao24 });
          setAircraft(metadata);
        }
      })();
    } catch (error) {
      console.log(error);
    }
  }, []);
  
  let rows = [
    { data: state, key: "callsign", title: "Callsign" },
    { data: aircraft, key: "registration", title: "Registration", href: (value) => `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${value}` },
    { data: aircraft, keys: ["manufacturerName", "model"], title: "Aircraft Type" },
    { data: aircraft, key: "owner", title: "Owner" },
    { data: state, key: "baro_altitude", title: "Calibrated Altitude", unit: "ft", multiplier: 3.28084 },
    { data: state, key: "geo_altitude", title: "GPS Altitude", unit: "ft", multiplier: 3.28084 },
    { data: state, key: "velocity", title: "Ground Speed", unit: "mph", multiplier: 2.23694 },
    { data: state, key: "vertical_rate", title: "Vertical Speed", unit: "fpm", multiplier: 196.85 },
    { data: state, key: "true_track", title: "Coarse", unit: "°", separator: '' },
    { data: state, key: "last_contact", title: "Last Contact", formatter: (value) => moment.unix(value).fromNow() },
  ];

  const getProperty = (data, keyPath) => {
    if (keyPath.indexOf('.') > -1) {
      let parts = keyPath.split('.');
      const firstKey = parts.shift();

      return getProperty(data[firstKey], parts.join('.'));
    } else {
      return data[keyPath];
    }
  };

  const getValue = (aircraft, row) => {
    if (row.keys) {
      return row.keys
        .map((key) => {
          let newRow = Object.assign({}, row);
          delete newRow.keys;
          newRow.key = key;

          return getValue(aircraft, newRow);
        })
        .join(row.separator || ' ');
    } else {
      let value = getProperty(aircraft, row.key);

      if (value) {
        if (row.formatter) {
          value = row.formatter(value);
        } else {
          if (row.multiplier) {
            value *= row.multiplier;
          }

          if (!isNaN(value)) {
            value = Math.floor(value);
          }

          if (row.unit) {
            if (row.separator !== null && row.separator !== undefined) {
              value = `${value}${row.separator}${row.unit}`;
            } else {
              value = `${value} ${row.unit}`;
            }
          }
        }

        return value;
      }

      return "N/A";
    }
  };

  const route = (aircraft || {}).route || [];
  const departure = route[0] || "—";
  const arrival = (route.length > 1 ? route[route.length - 1] : null) || "—";

  let hoverTime = null;

  if (aircraft && aircraft.hovering_time) {
    const minutes = (aircraft.hovering_time / 60).toFixed();

    if (minutes === 60) {
      hoverTime = 'more than 1 hour';
    } else {
      hoverTime = `${minutes} minutes`;
    }
  }

  return (
    <div className="aircraft">
      {aircraft && <Grid className="aircraft-container" container spacing={2}>
        {hoverTime && <Grid item xs={12}>
          <Typography className="hover-time" variant="subtitle1" component="span">{aircraft.callsign} has been hovering for <strong>{hoverTime}</strong></Typography>
        </Grid>}
        <Grid item style={{ padding: 0 }} xs={12}>
          <TableContainer style={{ minWidth: 200, maxWidth: 560, margin: 'auto', marginTop: '20px' }} component={Paper}>
            <Table size="small" aria-label="aircraft information">
              <TableBody>
                <TableRow key="route">
                  <TableCell className={departure.length === 1 ? 'subtle' : ''} align="right" component="th" scope="row" style={{ width: '50%' }}>
                    <Typography variant="h6" component="h6">{departure}</Typography>
                  </TableCell>
                  <TableCell align="center"><Typography variant="h6" component="h6">✈️</Typography></TableCell>
                  <TableCell className={arrival.length === 1 ? 'subtle' : ''} align="left" style={{ width: '50%' }}>
                    <Typography variant="h6" component="h6">{arrival}</Typography>
                  </TableCell>
                </TableRow>
                {rows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell component="th" scope="row">
                      {row.title}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell align="right">
                      {row.href && <a target="_blank" href={row.href(getValue(aircraft, row))}>{getValue(aircraft, row)}</a>}
                      {!row.href && getValue(aircraft, row)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {aircraft.photos.length > 0 && <img onClick={() => setModalImage(aircraft.photos[0])} className="thumbnail" src={aircraft.photos[0]} />}
        </Grid>
      </Grid>}
    </div>
  );
}

export default Aircraft;
