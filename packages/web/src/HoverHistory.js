import * as moment from 'moment';
import * as turf from '@turf/turf';
import { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Stack from 'react-bootstrap/Stack';
import * as polyline from '@mapbox/polyline';
import {
  IoSpeedometerOutline as GuageIcon,
  IoAirplaneOutline as PlaneIcon,
  IoCloudOutline as CloudIcon,
  IoCompassOutline as CompassIcon,
} from 'react-icons/io5';

function HoverHistory({ api, icao24, setLocation, setHistoryAircraft }) {

  const [hoverEvents, setHoverEvents] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [flights, setFlights] = useState({});

  console.log('hover history');

  useEffect(() => {
    api.hoverEvents(icao24)
      .then((hoverEvents) => {
        setHoverEvents(hoverEvents);

        const flightIDs = [...new Set(hoverEvents.map(event => event.flightID))];

        return Promise.all(flightIDs.map(api.getFlight))
          .then((flights) => {
            return Promise
              .resolve(flights
                .reduce((values, value) => {
                  values[`${value.icao24}:${value.startTime}:${value.endTime}`] = value;
                  return values;
                }, {}));
          });
      })
      .then(setFlights)
      .catch(console.log);
    api.metadata({ icao24 })
      .then(setMetadata)
      .catch(console.log);
  }, [icao24]);

  const selectEvent = (event) => {
    const points = polyline.decode(event.routePolyline);
    const center = turf.getCoord(turf.center(turf.points(points)));
    console.log(center);
    const lastPoint = points[0];
    // setLocation({ latitude: center[0], longitude: center[1] });

    const history = points.map((point) => ({ latitude: point[0], longitude: point[1] }));
    history.pop();

    setHistoryAircraft({
      [event.icao24]: {
        state: {
          icao24: event.icao24,
          latitude: lastPoint[0],
          longitude: lastPoint[1],
          callsign: metadata.registration,
        },
        history,
        metadata,
        distance: 0,
        recentHistory: history,
        isHelicopter: () => {
          if (!metadata) {
            return false;
          }

          return (metadata.icaoAircraftClass?.startsWith("H") || false)
            || (metadata.manufacturer?.split(" ").indexOf("Bell") || -1) > -1
            || (metadata.manufacturer?.split(" ").indexOf("Robinson") || -1) > -1;
        },
      }
    });
  };

  return (
    <Container fluid>
      {/*{state.hoverTime && <Row className="mt-3 ps-1">
        <Col xs={1}>
          <PlaneIcon className="text-muted" style={{ width: 20, height: 20 }} />
        </Col>
        <Col xs={11} className="text-start">
          <small className="fw-bolder text-muted text-uppercase" style={{ fontSize: '0.8rem' }}>Aircrafts have hovered for</small>
          <div className="fs-6 pb-2">{moment.duration(state.hoverTime, 'seconds').humanize()}</div>
        </Col>
      </Row>}*/}
      <Row>
        <Col xs={12}>
          <ListGroup>
            {hoverEvents.map(event => (
              <ListGroup.Item key={event.startTime} action href={`#${event.startTime}`} onClick={() => selectEvent(event)}>
                {moment.unix(event.startTime).fromNow()}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}

export default HoverHistory;
