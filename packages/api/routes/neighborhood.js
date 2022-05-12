const { Router } = require('express');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const database = require('@chopper-report/database-admin');

module.exports = () => {
  let router = Router();

  router.get('/:neighborhood', async (req, res) => {
    try {
      console.log(req.url);
      const neighborhood

      res.set('Cache-Control', 'public, max-age=14400, s-maxage=14400');
      res.status(200).send('');
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
