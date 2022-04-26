import './Aircrafts.css';

import Aircraft from './Aircraft';

import { useState } from 'react';

import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Backdrop from '@mui/material/Backdrop';
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

  return (
    <div className="aircrafts">
      <Stack spacing={2}>
        {presentIcaos.length === 0 && <Typography style={{ fontWeight: 500 }} variant="h5" component="h4">Nothing is hovering over you at the moment 🙌</Typography>}
        {presentIcaos.length === 1 && <Typography style={{ fontWeight: 500 }} variant="h5" component="h4">There's one aircraft hovering over you 😩</Typography>}
        {presentIcaos.length > 1 && <Typography style={{ fontWeight: 500 }} variant="h5" component="h4">There are {presentIcaos.length} aircrafts hovering over you 🤬</Typography>}
        <Carousel
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
        {presentIcaos.length > 1 && <Pagination count={presentIcaos.length} page={page} onChange={handleChangePage} />}
      </Stack>
      {aircrafts && presentIcaos[page - 1] && <Backdrop
        className="image-modal"
        open={modalImage !== null}
        onClick={() => setModalImage(null)}
      >
        <img alt="large aircraft" src={modalImage} />
      </Backdrop>}
    </div>
  );
}

export default Aircrafts;
