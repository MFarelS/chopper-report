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
import {
  GiAirplaneArrival as LandIcon,
  GiAirplaneDeparture as TakeOffIcon,
  GiWhirlwind as WindIcon
} from "react-icons/gi";

function HoverHistory({ api, icao24, setLocation, location, setHistoryAircraft }) {

  const [hoverEvents, setHoverEvents] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [flights, setFlights] = useState({});

  console.log('hover history');

  useEffect(() => {
    api.hoverEvents(icao24, moment().subtract(7, 'days').unix())
      .then((hoverEvents) => {
        const filtered = hoverEvents
          .filter((event) => {
            const distance = turf.distance(
              turf.point([event.latitude, event.longitude]),
              turf.point([location.latitude, location.longitude])
            );

            return distance < 2
          });

        const flightIDs = [...new Set(filtered.map(event => event.flightID))];

        return Promise.all(flightIDs.map(api.getFlight))
          .then((flights) => {
            return Promise
              .resolve(flights
                .reduce((values, value) => {
                  values[`${value.icao24}:${value.startTime}:${value.endTime}`] = value;
                  return values;
                }, {}));
          })
          .then((flights) => {
            setFlights(flights);
            setHoverEvents(filtered.reverse());
          });
      })
      .catch(console.log);
    api.metadata({ icao24 })
      .then(setMetadata)
      .catch(console.log);
  }, [icao24]);

  const selectEvent = (event) => {
    const points = polyline.decode(event.routePolyline);
    const center = turf.getCoord(turf.center(turf.points(points)));
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
        flight: flights[event.flightID],
        isHelicopter: () => {
          if (!metadata) {
            return false;
          }

          return (metadata.icaoAircraftClass?.startsWith("H") || false)
            || (metadata.manufacturer?.split(" ").indexOf("Bell") || -1) > -1
            || (metadata.manufacturer?.split(" ").indexOf("Robinson") || -1) > -1
            || (metadata.manufacturer || "").indexOf("Helicopter") > -1;
        },
      }
    });
  };

  const hoverFlights = hoverEvents
    .reduce((values, event) => {
      const dateKey = moment.unix(event.startTime).format('YYYYMMDD');

      if (values[dateKey]) {
        if (values[dateKey][event.flightID]) {
          values[dateKey][event.flightID].unshift(event);
        } else {
          values[dateKey][event.flightID] = [event];
        }
      } else {
        values[dateKey] = {
          [event.flightID]: [event],
        };
      }

      return values;
    }, {});

  return (
    <Container fluid className="ms-1 mt-2">
      <Row className="mb-2">
        <Col xs={12} className="text-start">
          <span>Hover Log</span>
        </Col>
      </Row>
      {Object.keys(hoverFlights).sort((x, y) => parseInt(y) - parseInt(x)).map((dateKey) => {
        const dateFlights = hoverFlights[dateKey];
        const elements = Object.keys(dateFlights).map((flightID) => {
          const flight = flights[flightID];
          const events = dateFlights[flightID];

          return (
            <>
            <Row className="ms-1">
              <Col xs={1}>
                <TakeOffIcon className="text-muted" style={{ width: 20, height: 20 }} />
              </Col>
              <Col xs={11}>
                <small className="text-muted fw-bold">
                  {moment.unix(flight.startTime).format('h:mm a')}
                </small>
              </Col>
            </Row>
            {events.map((event) => (
              <Row
                className="ms-1 align-baseline text-hover-underline-span"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => selectEvent(event)}
                onMouseLeave={() => setHistoryAircraft({})}
              >
                <Col xs={1}></Col>
                <Col xs={11}>
                  <small className="text-muted fw-bold me-2">
                    {moment.unix(event.startTime).format('h:mm a')}
                  </small>
                  <span>
                    Hovers for {moment.duration((event.endTime - event.startTime) * 1000).humanize()}
                  </span>
                </Col>
              </Row>
            ))}
            <Row className="ms-1">
              <Col xs={1}>
                <LandIcon className="text-muted" style={{ width: 20, height: 20 }} />
              </Col>
              <Col xs={11}>
                <small className="text-muted fw-bold">
                  {moment.unix(flight.endTime).format('h:mm a')}
                </small>
              </Col>
            </Row>
            </>
          );
        });

        return (
          <div className="mb-2">
            <Row>
              <Col xs={12}>
                <small className="text-uppercase text-muted fw-bold ms-1">
                  {moment(dateKey, 'YYYYMMDD').format('dddd, MMMM Do YYYY')}
                </small>
              </Col>
            </Row>
            {elements}
          </div>
        );
      })}
    </Container>
  );
}

export default HoverHistory;
