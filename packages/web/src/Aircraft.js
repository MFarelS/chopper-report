import './Aircraft.css';

import * as moment from 'moment';
// import { useState, useEffect } from 'react';
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

  // const [route, setRoute] = useState([]);

  // useEffect(() => {
  //   try {
  //     (async () => {
  //       const r = await api.route({ callsign: state.callsign });
  //       setRoute(r);
  //     })();
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }, [state.callsign, api]);

  // const departure = route[0] || "—";
  // const arrival = (route.length > 1 ? route[route.length - 1] : null) || "—";

  let hoverTime = null;
  // let hoverSuffix = '.';

  if (state && state.hovering_time) {
    hoverTime = moment.duration(state.hovering_time * 1000).humanize();

    // if (distance > 5) {
    //   hoverSuffix = ', although it looks like it may be gone now 🥳'
    // }
  }

  const photos = Object.values((metadata || {}).photos || {});

  return (
    <div className="aircraft text-light" key={state.icao24}>
      <div className="aircraft-header bg-dark">
        <Stack direction="horizontal">
          <Stack>
            <span className="fs-5 fw-bold">{state.callsign}</span>
            {metadata.registration && metadata.registration !== state.callsign && <span className="fs-6">/{metadata.registration}</span>}
            <p className="fs-6">{metadata.owner.replace("Llc", "LLC")}</p>
          </Stack>
          {hoverTime && <Stack className="text-end">
            <span className="fs-5 fw-bold text-nowrap">{hoverTime}</span>
            <small style={{ fontSize: '0.8rem' }} className="fw-bolder text-muted text-uppercase">in the area</small>
          </Stack>}
        </Stack>
      </div>
      <Container className="aircraft-container" fluid>
        {photos.length > 0 && <Row>
          <Col>
            <img alt="aircraft" onClick={() => setModalImage(photos[0])} className="thumbnail" src={photos[0]} />
          </Col>
        </Row>}
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
    </div>
  );
}

export default Aircraft;
