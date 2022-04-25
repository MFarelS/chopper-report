require('dotenv').config();

const app = require('./app');

const port = process.env.PORT || 9000;

app.listen(port, () => {
  console.log(`chopper-report-api listening on port ${port}`)
});
