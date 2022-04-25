const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const aircraft = require('./routes/aircraft');

const app = express();

app.use(cors({ credentials: true, origin: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use(bodyParser.json());

app.use('/aircraft', aircraft());

module.exports = app;
