const { Router } = require('express');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const absolutify = require('../lib/absolutify');
const database = require('@chopper-report/database-admin');

module.exports = () => {
  let router = Router();

  router.get('/faa/:icao24', async (req, res) => {
    try {
      console.log(req.url);
      const { time } = req.query;
      const { icao24 } = req.params;
      // const { state, metadata } = req.body;
      const response = await fetch('https://noise.faa.gov/noise/pages/noise.html');
      const text = await response.text();
      const $ = cheerio.load(absolutify(text, 'https://noise.faa.gov/noise/pages'));
      $('.header').remove();
      $('#footer').remove();

      res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
      res.status(200).send($.html());
    } catch (error) {
      console.log(error);

      res.set('Cache-Control', 'public, max-age=0, s-maxage=0');
      return res.status(500).json({
        error: error.message,
      });
    }
  });

  return router;
}
