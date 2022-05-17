import * as moment from 'moment';
import { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Stack from 'react-bootstrap/Stack';
// import {
//   IoSpeedometerOutline as GuageIcon,
//   IoAirplaneOutline as PlaneIcon,
//   IoCloudOutline as CloudIcon,
//   IoCompassOutline as CompassIcon,
// } from 'react-icons/io5';

function HoverHistory({ api, icao24, setLocation, setHistoryAircraft }) {

  const [hoverEvents, setHoverEvents] = useState([]);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    api.hoverEvents(icao24)
      .then(setHoverEvents)
      .catch(console.log);
    api.metadata({ icao24 })
      .then(setMetadata)
      .catch(console.log);
  }, [icao24]);

  const selectEvent = (event) => {
    api.history(event.icao24, event.startTime, event.endTime)
      .then((states) => {
        const state = states.slice(-1)[0];

        setLocation({ latitude: state.latitude, longitude: state.longitude })
        setHistoryAircraft({
          [icao24]: {
            state,
            history: states,
            metadata,
            distance: 0,
            recentHistory: states,
            isHelicopter: () => {
              return metadata.icaoAircraftClass.startsWith("H")
                || metadata.manufacturer.split(" ").indexOf("Bell") > -1
                || metadata.manufacturer.split(" ").indexOf("Robinson") > -1;
            },
          }
        })
      })
      .catch(console.log);
  };

  return (
    <div className="aircraft-panel-container">
      <div className="aircraft-panel">
        <Container fluid>
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
      </div>
    </div>
  );
}

export default HoverHistory;
