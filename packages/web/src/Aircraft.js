import './Aircraft.css';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import * as moment from 'moment';
import { useState, useEffect } from 'react';

// takes degrees and returns direction
function getDirection(degrees) {
  if (degrees >= 337.5 || degrees < 22.5) {
    return 'N';
  } else if (degrees >= 22.5 && degrees < 67.5) {
    return 'NE';
  } else if (degrees >= 67.5 && degrees < 112.5) {
    return 'E';
  } else if (degrees >= 112.5 && degrees < 157.5) {
    return 'SE';
  } else if (degrees >= 157.5 && degrees < 202.5) {
    return 'S';
  } else if (degrees >= 202.5 && degrees < 247.5) {
    return 'SW';
  } else if (degrees >= 247.5 && degrees < 292.5) {
    return 'W';
  } else if (degrees >= 292.5 && degrees < 337.5) {
    return 'NW';
  }
}

function Aircraft({ api, debug, location, options, state, metadata, history, distance, setModalImage }) {

  const [route, setRoute] = useState([]);

  useEffect(() => {
    try {
      (async () => {
        const r = await api.route({ callsign: state.callsign });
        setRoute(r);
      })();
    } catch (error) {
      console.log(error);
    }
  }, [state.callsign, api]);

  let rows = [
    { data: state, key: "callsign", title: "Callsign", href: (value) => `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${metadata.registration}` },
    { data: metadata, keys: ["manufacturer", "model"], title: "Aircraft Type" },
    { data: metadata, key: "owner", title: "Owner", formatter: (value) => value.replace("Llc", "LLC") },
    { data: state, key: "baro_altitude", title: "Calibrated Altitude", unit: "ft", multiplier: 3.28084 },
    { data: state, key: "gps_altitude", title: "GPS Altitude", unit: "ft", multiplier: 3.28084 },
    { data: state, key: "velocity", title: "Ground Speed", unit: "mph", multiplier: 2.23694 },
    { data: state, key: "vertical_rate", title: "Vertical Speed", unit: "fpm", multiplier: 196.85 },
    { data: state, key: "true_track", title: "Coarse", formatter: (value) => `${value.toFixed(0)}° (${getDirection(value)})` },
    { data: state, key: "last_contact", title: "Last Contact", formatter: (value) => moment.unix(value).fromNow() },
    { data: state, key: "icao24", title: "ICAO24" },
    { data: state, key: "flightradar", value: "View on FlightRadar24", title: "", href: (value) => `https://fr24.com/${value.callsign}` },
  ];

  if (debug) {
    rows.push({ data: metadata, key: "icaoAircraftClass", title: "🐞 Aircraft Class" });
    rows.push({ key: "historyCount", title: "🐞 History Count", value: history.length });
    if (options.showHistory) {
      for (let s of history) {
        rows.push({ key: `history-${s.time}`, title: `🗓 ${moment.unix(s.time).format("h:mma")}`, value: s.baro_altitude, unit: "ft", multiplier: 3.28084 });
      }
    }
  }

  const getProperty = (data, keyPath) => {
    if (keyPath.indexOf('.') > -1) {
      let parts = keyPath.split('.');
      const firstKey = parts.shift();

      return getProperty(data[firstKey], parts.join('.'));
    } else {
      return data[keyPath];
    }
  };

  const getValue = (row) => {
    if (!row.data && !row.value) {
      return "N/A";
    }

    if (row.keys) {
      return [...new Set(row.keys
        .map((key) => {
          let newRow = Object.assign({}, row);
          delete newRow.keys;
          newRow.key = key;

          return getValue(newRow);
        }))]
        .join(row.separator || ' ');
    } else if (row.value) {
      return row.value;
    } else {
      let value = getProperty(row.data, row.key);

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

  const departure = route[0] || "—";
  const arrival = (route.length > 1 ? route[route.length - 1] : null) || "—";

  let hoverTime = null;
  let hoverSuffix = '.';

  if (state && state.hovering_time) {
    hoverTime = moment.duration(state.hovering_time * 1000).humanize();

    if (distance > 5) {
      hoverSuffix = ', although it looks like it may be gone now 🥳'
    }
  }

  const photos = Object.values((metadata || {}).photos || {});

  return (
    <div className="aircraft" key={state.icao24}>
      <Grid className="aircraft-container" container spacing={2}>
        {hoverTime && <Grid item xs={12} style={{ padding: 0 }}>
          <Typography className="hover-time" variant="subtitle1" component="span">{state.callsign} has been hovering for <strong>{hoverTime}</strong>{hoverSuffix}</Typography>
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
                  <TableRow key={row.key || row.keys[0]}>
                    <TableCell component="th" scope="row">
                      {row.title}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell align="right">
                      {row.href && <Link target="_blank" href={row.href(row.data)}>{getValue(row)}</Link>}
                      {!row.href && getValue(row)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {photos.length > 0 && <img alt="aircraft" onClick={() => setModalImage(photos[0])} className="thumbnail" src={photos[0]} />}
        </Grid>
      </Grid>
    </div>
  );
}

export default Aircraft;
