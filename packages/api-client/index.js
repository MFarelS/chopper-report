import * as database from '@chopper-report/database-client';

class API {

  constructor() {
    this.url = 'https://us-central1-chopper-report.cloudfunctions.net/api';
    database.initialize();
  }

  states(location, radius, time, callback) {
    const that = this;
    database.hoveringStates(location, radius, { time }, (event, icao24, state, history) => {
      that.metadata({ icao24 })
        .then((metadata) => {
          callback(event, icao24, state, metadata, history);
        })
        .catch(console.log);
    });
  }

  async history(icao24, begin, end) {
    return database.history(icao24, begin, end);
  }

  async aircraft({ icao24 }) {
    const response = await fetch(`${this.url}/aircraft?icao24=${icao24}`);
    const { aircraft } = await response.json();

    return aircraft;
  }

  async route({ callsign }) {
    const response = await fetch(`${this.url}/aircraft/${callsign}/route`);
    const { route } = await response.json();

    return route;
  }

  async metadata({ icao24 }) {
    const data = await database.metadata(icao24);

    if (data) {
      return data;
    } else {
      const response = await fetch(`${this.url}/aircraft/${icao24}/metadata`);
      const body = await response.json();

      return body;
    }
  }
}
 
export default API;
