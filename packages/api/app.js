const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const aircraft = require('./routes/aircraft');
const report = require('./routes/report');

const app = express();

app.use(cors({ credentials: true, origin: true }));

app.use(function(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    res.header("Access-Control-Allow-Origin", "whatshoveringover.me");
    res.header("Access-Control-Allow-Headers", "*");
  } else {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
  }
  next();
});

app.use(bodyParser.json());

app.use('/aircraft', aircraft());
// app.use('/report', report());

module.exports = app;
