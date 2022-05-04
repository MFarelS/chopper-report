import './Aircrafts.css';

import Aircraft from './Aircraft';

import { useState } from 'react';

import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';

function Aircrafts({ api, debug, options, location, aircrafts, allIcao24s, setSelectedIcao24, selectedIcao24 }) {

  const [page, setPage] = useState(1);

  const [modalImage, setModalImage] = useState(null);

  const handleChangePage = (event, value) => {
    setPage(value);
    setSelectedIcao24(allIcao24s[value - 1]);
  };

  const presentIcaos = allIcao24s.filter(icao24 => aircrafts[icao24]);

  let alertText = '';
  let alertIcon = '';
  if (presentIcaos.length <= 0) {
    alertText = "Nothing is hovering over you at the moment";
    alertIcon = "🙌";
  } else if (presentIcaos.length === 1) {
    alertText = "There's one aircraft hovering over you";
    alertIcon = "😩";
  } else {
    alertText = `There are {presentIcaos.length} aircrafts hovering over you`;
    alertIcon = "🤬";
  }

  return (
    <div className="aircrafts">
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
    </div>
  );
}

export default Aircrafts;
