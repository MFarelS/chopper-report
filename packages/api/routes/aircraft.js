const { Router } = require('express');
const { opensky, jetphotos } = require('@chopper-report/utils');
const database = require('@chopper-report/database-admin');

module.exports = () => {
  let router = Router();

  // GET /aircraft?icao24=<icao24>
  router.get('/', async (req, res) => {
    try {
      console.log(req.url);
      const icao24 = req.query.icao24.toLowerCase();
      const { states } = await opensky.states({ icao24 });
      res.status(200).json({ aircraft: states[0] });
    } catch (error) {
      console.log(error);

      res.set('Cache-Control', 'public, max-age=604800, s-maxage=604800');
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  // GET /aircraft/:icao24/metadata
  router.get('/:icao24/metadata', async (req, res) => {
    try {
      const { icao24 } = req.params;
      const aircraft = await opensky.aircraft({ icao24 });
      const photos = await jetphotos.search({ query: aircraft.registration });
      const filteredPhotos = photos.filter((photo) => photo.reg === aircraft.registration);

      const metadata = {
        photos: filteredPhotos.reduce((acc, photo, index) => {
          acc[`${index}`] = `https://cdn.jetphotos.com/full/${photo.filename}`;
          return acc;
        }, {}),
        registration: aircraft.registration,
        manufacturer: aircraft.manufacturerName,
        model: aircraft.model,
        typecode: aircraft.typecode,
        serialNumber: aircraft.serialNumber,
        icaoAircraftClass: aircraft.icaoAircraftClass,
        owner: aircraft.owner,
        lastUpdated: Math.floor((new Date()).getTime() / 1000),
      };
      await database.writeMetadata(icao24, metadata);
    
   
      res.set('Cache-Control', 'public, max-age=604800, s-maxage=604800');
      res.status(200).json({
        ...metadata,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        error: error.message,
      });
    }
  });

  // GET /aircraft/:callsign/route
  router.get('/:callsign/route', async (req, res) => {
    try {
      const { callsign } = req.params;
      const { route } = await opensky.route({
        callsign
      });
   
      res.set('Cache-Control', 'public, max-age=10800, s-maxage=10800');
      res.status(200).json({
        route,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        error: error.message,
      });
    }
  });

  return router;
}
