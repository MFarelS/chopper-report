import './Aircrafts.css';

import Aircraft from './Aircraft';
import Actions from './Actions';

import { useState } from 'react';
import Stack from 'react-bootstrap/Stack';
import Modal from 'react-bootstrap/Modal'

function Aircrafts({ api, debug, options, location, aircrafts, allIcao24s, setSelectedIcao24, selectedIcao24 }) {

  const [modalImage, setModalImage] = useState(null);

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

  return (
    <div>
      <Stack className="aircraft-panel">
        {allIcao24s.length > 0 && <div className="aircraft-spacer" />}
        <div className={`bg-dark text-light mb-2 p-3${allIcao24s.length > 0 ? '' : ' mt-auto'}`} style={{ opacity: 0.9, borderRadius: '1rem' }} >
          <Stack direction="horizontal">
            <span className="text-start">{alertText}</span>
            <span className="ms-auto text-end fs-3">{alertIcon}</span>
          </Stack>
        </div>
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
          {/* <Stack spacing={2}> */}
            {/* <div className="aircrafts-header">
              {presentIcaos.length === 0 && <span>Nothing is hovering over you at the moment 🙌</span>}
              {presentIcaos.length === 1 && <span>There's one aircraft hovering over you 😩</span>}
              {presentIcaos.length > 1 && <span>There are {presentIcaos.length} aircrafts hovering over you 🤬</span>}
            </div> */}
            {/* <Carousel
              selectedItem={page - 1}
              showArrows={false}
              showThumbs={false}
              showStatus={false}
              showIndicators={false} >
              {presentIcaos.map((icao24, index) => (
                <Aircraft
                  api={api}
                  debug={debug}
                  options={options}
                  state={aircrafts[icao24].state}
                  metadata={aircrafts[icao24].metadata}
                  distance={aircrafts[icao24].distance}
                  history={aircrafts[icao24].history}
                  setModalImage={setModalImage}
                  key={icao24} />
              ))}
            </Carousel>
            {presentIcaos.length > 1 && <Pagination count={presentIcaos.length} page={page} onChange={handleChangePage} />} */}
          {/* </Stack> */}
          {/* {aircrafts && presentIcaos[page - 1] && <Backdrop
            className="image-modal"
            open={modalImage !== null}
            onClick={() => setModalImage(null)}
          >
            <img alt="large aircraft" src={modalImage} />
          </Backdrop>} */}
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
