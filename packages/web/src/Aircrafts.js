import './Aircrafts.css';

import Aircraft from './Aircraft';
import Actions from './Actions';
import Neighborhood from './Neighborhood';

import { useState } from 'react';
import Stack from 'react-bootstrap/Stack';
import Modal from 'react-bootstrap/Modal'

function Aircrafts({ api, debug, options, radius, location, setLocation, setAircraftsOverride, aircrafts, allIcao24s, setSelectedIcao24, selectedIcao24 }) {

  const [modalImage, setModalImage] = useState(null);
  console.log('aircrafts');

  return (
    <div className="aircraft-panel-container">
      <Stack className="aircraft-panel">
        {allIcao24s.length > 0 && <div className="aircraft-spacer" />}
        <Neighborhood
          radius={radius}
          aircrafts={aircrafts}
          api={api}
          allIcao24s={allIcao24s}
          selectedIcao24={selectedIcao24}
          setSelectedIcao24={setSelectedIcao24}
          setAircraftsOverride={setAircraftsOverride}
          setLocation={setLocation}
          location={location} />
        {allIcao24s.length > 0 && <div className={`bg-dark aircrafts${allIcao24s.length > 0 ? ' pb-3' : ''}`}>
          {aircrafts[selectedIcao24] && <Aircraft
            api={api}
            debug={debug}
            options={options}
            state={aircrafts[selectedIcao24].state}
            metadata={aircrafts[selectedIcao24].metadata}
            distance={aircrafts[selectedIcao24].distance}
            history={aircrafts[selectedIcao24].history}
            setModalImage={setModalImage}
            key={selectedIcao24} />}
          <Modal dialogClassName="image-modal" contentClassName="bg-dark" centered show={modalImage !== null} onHide={() => setModalImage(null)}>
            <Modal.Header closeButton closeVariant="white" className="border-dark" />
            <Modal.Body>
              <img className="d-block mx-auto" alt="large aircraft" src={modalImage} />
            </Modal.Body>
          </Modal>
        </div>}
      </Stack>
      <Stack className="float-end position-absolute top-0 end-0 mt-4 me-2" style={{ zIndex: 1000 }}>
        {selectedIcao24 && <Actions api={api} aircrafts={aircrafts} selectedIcao24={selectedIcao24} />}
      </Stack>
    </div>
  );
}

export default Aircrafts;
