import { useState, useEffect } from 'react';

import HoverHistory from './HoverHistory';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import * as moment from 'moment';

import {
  IoHomeOutline as HomeIcon,
  IoAirplaneOutline as PlaneIcon,
} from 'react-icons/io5';
import { GiWhirlwind as WindIcon } from "react-icons/gi";

function Neighborhood({ api, debug, options, location, setLocation, setAircraftsOverride, startTime, hoverEvents, radius, aircrafts, allIcao24s, selectedIcao24, setSelectedIcao24 }) {

  const [address, setAddress] = useState(null);
  const [state, setState] = useState({
    metadata: {},
    states: {},
    hoverTimes: {},
    hoverEvents: {},
  });

  useEffect(() => {
    (async () => {
      try {
        // const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`);
        // const { address } = await response.json();
        // setAddress(address);

        const grouped = hoverEvents
          .reduce((values, value) => ({
            ...values,
            [value.icao24]: [
              ...(values[value.icao24] || []),
              value
            ],
          }), {});

        const icaos = Object.values(grouped)
          .sort((a, b) => b.length - a.length)
          .map(x => x[0].icao24);
        const metadata = (await Promise
          .all(icaos.map(icao24 => api.metadata({ icao24 }).then(x => ({ ...x, icao24 })))))
          .filter(x => x.registration);
        const states = await Promise
          .all(icaos.map(icao24 => api.lastState(icao24)));
        console.log(metadata);

        setState(state => ({
          ...state,
          startTime,
          hoverTime: hoverEvents.reduce((sum, value) => sum + value.hoverTime, 0),
          topOffenders: metadata.map(x => ({ callsign: x.registration, icao24: x.icao24 })),
          metadata: metadata.reduce((values, value) => ({ ...values, [value.icao24]: value }), {}),
          states: states.reduce((values, value) => {
            if (value) {
              values[value.icao24] = value;
            }

            return values;
          }, {}),
          hoverEvents: grouped,
          hoverTimes: Object.keys(grouped).reduce((values, icao24) => ({ ...values, [icao24]: grouped[icao24].reduce((sum, cur) => sum + cur.hoverTime, 0) }), {}),
        }));
      } catch (error) {
        console.log(error);
      }
    })();
  }, [location, radius, api, hoverEvents]);

  const presentIcaos = allIcao24s.filter(icao24 => aircrafts[icao24]);

  let alertText = '';
  let alertIcon = '';
  if (presentIcaos.length <= 0) {
    alertText = "Nothing is hovering near you at the moment";
    alertIcon = "🙌";
  } else if (presentIcaos.length === 1) {
    alertText = "There's one aircraft hovering near you";
    alertIcon = "😩";
  } else {
    alertText = `There are ${presentIcaos.length} aircrafts hovering near you`;
    alertIcon = "🤬";
  }

  const renderOverlay = (props) => (
    <Popover id="aircraft-overlay" {...props} className="bg-light text-dark text-nowrap">
      <Popover.Body>
        <Container fluid className="p-0">
          {state.metadata[props.icao24]?.photos && <Row className="pb-2">
            <img style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }} alt="aircraft" src={state.metadata[props.icao24].photos[0]} />
          </Row>}
          {state.metadata[props.icao24]?.registration && <Row className="flex-nowrap">
            <small className="text-muted" style={{ width: 'auto' }}>Callsign</small>
            <small className="text-end ms-auto" style={{ width: 'auto' }}>{state.metadata[props.icao24].registration}</small>
          </Row>}
          {state.metadata[props.icao24]?.manufacturer && <Row className="flex-nowrap">
            <small className="text-muted" style={{ width: 'auto' }}>Manufacturer</small>
            <small className="text-end ms-auto" style={{ width: 'auto' }}>{state.metadata[props.icao24].manufacturer}</small>
          </Row>}
          {state.metadata[props.icao24]?.model && <Row className="flex-nowrap">
            <small className="text-muted" style={{ width: 'auto' }}>Model</small>
            <small className="text-end ms-auto" style={{ width: 'auto' }}>{state.metadata[props.icao24].model}</small>
          </Row>}
          {state.states[props.icao24]?.last_contact && <Row className="flex-nowrap">
            <small className="text-muted" style={{ width: 'auto' }}>Last Seen</small>
            <small className="text-end ms-auto" style={{ width: 'auto' }}>{moment.unix(state.states[props.icao24].last_contact).fromNow()}</small>
          </Row>}
          {state.hoverEvents[props.icao24] && <Row className="flex-nowrap">
            <small className="text-muted" style={{ width: 'auto' }}>Hovered</small>
            <small className="text-end ms-auto" style={{ width: 'auto' }}>{state.hoverEvents[props.icao24].length} {state.hoverEvents[props.icao24].length === 1 ? 'time' : 'times'}</small>
          </Row>}
          {state.hoverTimes[props.icao24] && <Row className="flex-nowrap">
            <small className="text-muted" style={{ width: 'auto' }}>Time Hovering</small>
            <small className="text-end ms-auto" style={{ width: 'auto' }}>{moment.duration(state.hoverTimes[props.icao24], 'seconds').humanize()}</small>
          </Row>}
        </Container>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className={allIcao24s.length > 0 ? 'mb-2' : 'mb-2 mt-auto'}>
      <Stack className="bg-dark text-light pb-3" style={{ opacity: 0.9, borderRadius: '1rem' }} >
        <Stack direction="horizontal" className="px-3 pt-3 pb-2">
          <span className="text-start">{alertText}</span>
          <span className="ms-auto text-end fs-3">{alertIcon}</span>
        </Stack>
        <Container fluid>
          {address && <Row className="ps-1">
            <Col xs={1}>
              <HomeIcon className="text-muted" style={{ width: 20, height: 20 }} />
            </Col>
            <Col xs={11} className="text-start">
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Neighborhood</small>
              <div className="fs-6 pb-2">{address.neighbourhood}</div>
            </Col>
          </Row>}
          {state.startTime && <Row className="mt-3 ps-1">
            <Col xs={12} className="text-start">
              <span>In your area in the last {(options?.time ? moment.unix(options.time) : moment()).diff(state.startTime, 'days')} days</span>
            </Col>
          </Row>}
          {state.hoverTime && <Row className="mt-3 ps-1">
            <Col xs={1}>
              <WindIcon className="text-muted" style={{ width: 20, height: 20 }} />
            </Col>
            <Col xs={11} className="text-start">
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Aircrafts have hovered for</small>
              <div className="fs-6 pb-2">{moment.duration(state.hoverTime, 'seconds').humanize()}</div>
            </Col>
          </Row>}
          {state.topOffenders && <Row className="mt-3 ps-1">
            <Col xs={1}>
              <PlaneIcon className="text-muted" style={{ width: 20, height: 20 }} />
            </Col>
            <Col xs={11} className="text-start">
              <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Top Offenders</small>
              <div className="fs-6 pb-2">{state.topOffenders?.map(({ callsign, icao24 }, index) => (
                <OverlayTrigger
                  key={callsign}
                  placement="top"
                  delay={{ show: 250, hide: 250 }}
                  overlay={(props) => renderOverlay({ ...props, icao24 })}
                >
                  <span style={{ cursor: 'pointer' }} className={selectedIcao24 === icao24 ? 'fw-bold' : ''}><a onClick={() => setSelectedIcao24(icao24)}>{callsign}</a>{index === state.topOffenders.length - 1 ? '' : ', '}</span>
                </OverlayTrigger>
              ))}</div>
            </Col>
          </Row>}
        </Container>
        {selectedIcao24 && <HoverHistory
          api={api}
          icao24={selectedIcao24}
          setLocation={setLocation}
          location={location}
          setHistoryAircraft={setAircraftsOverride} />}
      </Stack>
    </div>
  );
}

export default Neighborhood;
