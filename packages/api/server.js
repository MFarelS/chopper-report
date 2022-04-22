require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const current = require('./routes/current');
const aircraft = require('./routes/aircraft');

const app = express();
const port = process.env.PORT || 9000;

app.use(cors({ credentials: true, origin: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use(bodyParser.json());

app.use('/api/current', current());
app.use('/api/aircraft', aircraft());

app.listen(port, () => {
  console.log(`chopper-report-api listening on port ${port}`)
});
