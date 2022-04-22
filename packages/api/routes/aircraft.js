const { Router } = require('express');
const opensky = require('../lib/opensky');
const jetphotos = require('../lib/jetphotos');

module.exports = () => {
  let router = Router();

  // GET /api/aircraft?icao24=<icao24>
    router.get('/', async (req, res) => {
        try {
            console.log(req.url);
            const icao24 = req.query.icao24.toLowerCase();
            const { states } = await opensky.states({ icao24 });
            res.json({ aircraft: states[0] });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
            error: error.message,
            });
        }
    });

    // GET /api/aircraft/:icao24/metadata
    router.get('/:icao24/metadata', async (req, res) => {
        try {
            const { icao24 } = req.params;
            const aircraft = await opensky.aircraft({ icao24 });
              // console.log("aircraft", aircraft);
            const { route } = await opensky.route({
                callsign: aircraft.registration,
              });
              // console.log("route", route);
              const photos = await jetphotos.search({ query: aircraft.registration });
              // console.log("photos", photos);
              const filteredPhotos = photos.filter((photo) => photo.reg === aircraft.registration);

              return {
                photos: filteredPhotos.map((photo) => `https://cdn.jetphotos.com/full/${photo.filename}`),
                route,
                ...aircraft,
              };
        } catch (error) {
          console.log(error);
    
          return res.status(500).json({
            error: error.message,
          });
        }
      });

  return router;
}
