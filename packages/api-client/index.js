import * as database from '@chopper-report/database-client';
import * as turf from "@turf/turf";

class API {

  constructor() {
    this.url = process.env.NODE_ENV === 'production' ? 'https://us-central1-chopper-report.cloudfunctions.net/api' : 'http://localhost:9000';
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

  allStates(location, radius, time, callback) {
    const that = this;
    const point = turf.point([location.latitude, location.longitude]);
    const buffered = turf.circle(point, radius / 1000, { units: 'kilometers', steps: 8 });
    const box = turf.bboxPolygon(turf.square(turf.bbox(buffered)));
    const coordinates = [[box.bbox[0], box.bbox[1]], [box.bbox[2], box.bbox[3]]];

    database.states(coordinates, { time }, (event, icao24, state, history) => {
      that.metadata({ icao24 })
        .then((metadata) => {
          callback(event, icao24, state, metadata, history);
        })
        .catch(console.log);
    });
  }

  // reportFAA(icao24) {
  //   return `${this.url}/report/faa/${icao24}`;
  // }

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

  // async countReport(icao24, reportType) {
  //   await database.countReport(icao24, reportType);
  // }
}
 
export default API;
