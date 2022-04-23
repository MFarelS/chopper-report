const database = require('@chopper-report/database');

class API {

  constructor() {
    this.url = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:9000/api';
    database.client().initialize();
  }

  states({ lamin, lamax, lomin, lomax }, callback) {
    database.client().states({ lamin, lamax, lomin, lomax }, callback);
  }

  async current({ latitude, longitude }) {
    const response = await fetch(`${this.url}/current?latitude=${latitude}&longitude=${longitude}`);
    const { aircrafts } = await response.json();

    return aircrafts;
  }

  async aircraft({ icao24 }) {
    const response = await fetch(`${this.url}/aircraft?icao24=${icao24}`);
    const { aircraft } = await response.json();

    return aircraft;
  }

  async metadata({ icao24 }) {
    const response = await fetch(`${this.url}/aircraft/${icao24}/metadata`);
    const body = await response.json();

    return body;
  }
}
 
export default API;
