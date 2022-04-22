import './Aircrafts.css';

import Aircraft from './Aircraft';

import { useState, useRef } from 'react';

import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Backdrop from '@mui/material/Backdrop';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';

function Aircrafts({ api, location, aircrafts }) {

  const carousel = useRef(null);
  const [page, setPage] = useState(1);
  const handleChangePage = (event, value) => {
    setPage(value);
    // if (carousel.current) {
    //   console.log(carousel.current);
    //   carousel.current.changeItem(value - 1);
    // }
  };

  const [modalImage, setModalImage] = useState(null);

  return (
    <div className="aircrafts">
      <Stack spacing={2}>
        {aircrafts.length === 0 && <Typography style={{ fontWeight: 500 }} variant="h5" component="h4">Nothing is hovering over you at the moment 🙌</Typography>}
        {aircrafts.length === 1 && <Typography style={{ fontWeight: 500 }} variant="h5" component="h4">There's one aircraft hovering over you 😩</Typography>}
        {aircrafts.length > 1 && <Typography style={{ fontWeight: 500 }} variant="h5" component="h4">There are {aircrafts.length} aircrafts hovering over you 🤬</Typography>}
        <Carousel
          selectedItem={page - 1}
          showArrows={false}
          showThumbs={false}
          showStatus={false}
          showIndicators={false} >
          {aircrafts.map((aircraft, index) => (
            <Aircraft
              api={api}
              state={aircraft}
              setModalImage={setModalImage}
              key={aircraft.icao24} />
          ))}
        </Carousel>
        {aircrafts.length > 1 && <Pagination count={aircrafts.length} page={page} onChange={handleChangePage} />}
      </Stack>
      {aircrafts && aircrafts[page - 1] && <Backdrop
        className="image-modal"
        open={modalImage !== null}
        onClick={() => setModalImage(null)}
      >
        <img src={modalImage} />
      </Backdrop>}
    </div>
  );
}

export default Aircrafts;
