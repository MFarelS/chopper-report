import './Aircraft.css';

import * as moment from 'moment';
import { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import {
  IoSpeedometerOutline as GuageIcon,
  IoAirplaneOutline as PlaneIcon,
  IoCloudOutline as CloudIcon,
  IoCompassOutline as CompassIcon,
} from 'react-icons/io5';

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

  // let rows = [
  //   { data: state, key: "callsign", title: "Callsign", href: (value) => `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${metadata.registration}` },
  //   { data: metadata, keys: ["manufacturer", "model"], title: "Aircraft Type" },
  //   { data: metadata, key: "owner", title: "Owner", formatter: (value) => value.replace("Llc", "LLC") },
  //   { data: state, key: "last_contact", title: "Last Contact", formatter: (value) => moment.unix(value).fromNow() },
  //   { data: state, key: "icao24", title: "ICAO24" },
  //   { data: state, key: "flightradar", value: "FlightRadar24 →", title: "", href: (value) => `https://fr24.com/${value.callsign}` },
  // ];

  // let stateRows = [
  //   { data: state, key: "baro_altitude", title: "Calibrated Altitude", unit: "ft", multiplier: 3.28084 },
  //   { data: state, key: "gps_altitude", title: "GPS Altitude", unit: "ft", multiplier: 3.28084 },
  //   { data: state, key: "velocity", title: "Ground Speed", unit: "mph", multiplier: 2.23694 },
  //   { data: state, key: "vertical_rate", title: "Vertical Speed", unit: "fpm", multiplier: 196.85 },
  //   { data: state, key: "true_track", title: "Coarse", formatter: (value) => `${value.toFixed(0)}° (${getDirection(value)})` },
  // ]

  // if (debug) {
  //   rows.push({ data: metadata, key: "icaoAircraftClass", title: "🐞 Aircraft Class" });
  //   rows.push({ key: "historyCount", title: "🐞 History Count", value: history.length });
  //   if (options.showHistory) {
  //     for (let s of history) {
  //       rows.push({ key: `history-${s.time}`, title: `🗓 ${moment.unix(s.time).format("h:mma")}`, value: s.baro_altitude, unit: "ft", multiplier: 3.28084 });
  //     }
  //   }
  // }

  // const getProperty = (data, keyPath) => {
  //   if (keyPath.indexOf('.') > -1) {
  //     let parts = keyPath.split('.');
  //     const firstKey = parts.shift();

  //     return getProperty(data[firstKey], parts.join('.'));
  //   } else {
  //     return data[keyPath];
  //   }
  // };

  // const getValue = (row) => {
  //   if (!row.data && !row.value) {
  //     return "N/A";
  //   }

  //   if (row.keys) {
  //     return [...new Set(row.keys
  //       .map((key) => {
  //         let newRow = Object.assign({}, row);
  //         delete newRow.keys;
  //         newRow.key = key;

  //         return getValue(newRow);
  //       }))]
  //       .join(row.separator || ' ');
  //   } else if (row.value) {
  //     return row.value;
  //   } else {
  //     let value = getProperty(row.data, row.key);

  //     if (value) {
  //       if (row.formatter) {
  //         value = row.formatter(value);
  //       } else {
  //         if (row.multiplier) {
  //           value *= row.multiplier;
  //         }

  //         if (!isNaN(value)) {
  //           value = Math.floor(value);
  //         }

  //         if (row.unit) {
  //           if (row.separator !== null && row.separator !== undefined) {
  //             value = `${value}${row.separator}${row.unit}`;
  //           } else {
  //             value = `${value} ${row.unit}`;
  //           }
  //         }
  //       }

  //       return value;
  //     }

  //     return "N/A";
  //   }
  // };

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
    <div className="aircraft text-light" key={state.icao24}>
      <div className="aircraft-header bg-dark">
        <span className="fs-5 fw-bold">{state.callsign}</span>
        {metadata.registration && metadata.registration !== state.callsign && <span className="fs-6">/{metadata.registration}</span>}
        <p className="fs-6">{metadata.owner}</p>
      </div>
      <Container className="aircraft-container" fluid>
        <Row>
          <Col>
            <img alt="aircraft" onClick={() => setModalImage(photos[0])} className="thumbnail" src={photos[0]} />
          </Col>
        </Row>
        <Row className="mt-3 ms-1">
          <Col xs={1}>
            <PlaneIcon className="text-muted" style={{ width: 20, height: 20 }} />
          </Col>
          <Col xs={11} className="text-start">
            <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Aircraft Manufacturer</small>
            <div className="fs-6 pb-2">{metadata.manufacturer}</div>
          </Col>
        </Row>
        <Row className="text-start ms-1">
          <Col xs={1}></Col>
          <Col xs={5} className="mt-1">
            <Stack>
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Aircraft Model</small>
              <div className="fs-6 pb-2">{metadata.model}</div>
            </Stack>
          </Col>
          <Col xs={6} className="mt-1">
            <Stack>
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Last Contact</small>
              <div className="fs-6 pb-2">{moment.unix(state.last_contact).fromNow()}</div>
            </Stack>
          </Col>
        </Row>
        <Row className="text-start ms-1">
          <Col xs={1}>
            <CloudIcon className="text-muted" style={{ width: 20, height: 20 }} />
          </Col>
          <Col xs={5} className="mt-1">
            <Stack>
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Calibrated Alt</small>
              <div className="fs-6 pb-2">{Number(state.baro_altitude * 3.28084).toFixed(0)} ft</div>
            </Stack>
          </Col>
          <Col xs={6} className="mt-1">
            <Stack>
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>GPS Alt</small>
              <div className="fs-6 pb-2">{Number(state.gps_altitude * 3.28084).toFixed(0)} ft</div>
            </Stack>
          </Col>
        </Row>
        <Row className="text-start ms-1">
          <Col xs={1}>
            <GuageIcon className="text-muted" style={{ width: 20, height: 20 }} />
          </Col>
          <Col xs={5} className="mt-1">
            <Stack>
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Ground Speed</small>
              <div className="fs-6 pb-2">{Number(state.velocity * 2.23694).toFixed(0)} mph</div>
            </Stack>
          </Col>
          <Col xs={6} className="mt-1">
            <Stack>
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Vertical Speed</small>
              <div className="fs-6 pb-2">{Number(state.vertical_rate * 196.85).toFixed(0)} fpm</div>
            </Stack>
          </Col>
        </Row>
        <Row className="text-start ms-1">
          <Col xs={1}>
            <CompassIcon className="text-muted" style={{ width: 20, height: 20 }} />
          </Col>
          <Col xs={5} className="mt-1">
            <Stack>
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Course</small>
              <div className="fs-6 pb-2">{state.true_track.toFixed(0)}°</div>
            </Stack>
          </Col>
          <Col xs={6} className="mt-1">
            <Stack>
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Direction</small>
              <div className="fs-6 pb-2">{getDirection(state.true_track)}</div>
            </Stack>
          </Col>
        </Row>
        
      </Container>
      {/* <Grid className="aircraft-container" container spacing={2}>
        
      </Grid> */}
      {/* <Grid className="aircraft-container" container spacing={2}>
        {hoverTime && <Grid item xs={12} style={{ padding: 0 }}>
          <Typography className="hover-time" variant="subtitle1" component="span">{state.callsign} has been hovering for <strong>{hoverTime}</strong>{hoverSuffix}</Typography>
        </Grid>}
        <Grid item style={{ padding: 0 }} xs={6}>
          <Stack className="aircraft-info" direction="column" alignItems="flex-start">
            {rows.map((row) => (
              <div key={row.key || row.keys[0]}>
                <span className="aircraft-info-value">
                  {row.href && <Link target="_blank" href={row.href(row.data)}>{getValue(row)}</Link>}
                  {!row.href && getValue(row)}
                </span>
                <span className="aircraft-info-title">
                  {row.title}
                </span>
              </div>
            ))}
          </Stack>
        </Grid>
        {photos.length > 0 && <Grid item xs={6}>
          <Stack style={{ height: '100%' }} direction="column" justifyContent="flex-start" alignItems="flex-end">
            <img alt="aircraft" onClick={() => setModalImage(photos[0])} className="thumbnail" src={photos[0]} />
          </Stack>
        </Grid>}
        <Grid item style={{ padding: 0 }} xs={12}>
          <Stack className="aircraft-state" direction="column" alignItems="flex-start">
            {stateRows.map((row) => (
              <div key={row.key || row.keys[0]}>
                <span className="aircraft-info-value">
                  {row.href && <Link target="_blank" href={row.href(row.data)}>{getValue(row)}</Link>}
                  {!row.href && getValue(row)}
                </span>
                <span className="aircraft-info-title">
                  {row.title}
                </span>
              </div>
            ))}
          </Stack>
        </Grid>
      </Grid> */}
    </div>
  );
}

export default Aircraft;
