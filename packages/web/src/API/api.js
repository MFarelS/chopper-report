

class API {

  constructor() {
    this.url = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:9000/api';
  }

  async current({ latitude, longitude }) {
    if (process.env.REACT_APP_MOCK === 'true') {
      return [{
        icao24: 'a4caf6',
        callsign: 'N408GG',
        origin_country: 'United States',
        time_position: 1650308733,
        last_contact: 1650308734,
        longitude: longitude+0.0005,
        latitude: latitude+0.0005,
        baro_altitude: 175.26,
        on_ground: false,
        velocity: 46.94,
        true_track: 48,
        vertical_rate: -1.63,
        sensors: null,
        geo_altitude: 236.22,
        squawk: '1200',
        spi: false,
        position_source: 0,
        type: "Bell 407GX",
        hovering_time: 1620,
        photos: ['https://cdn.jetphotos.com/full/6/72078_1646798321.jpg'],
        owner: 'HELICOPTER PROFESSIONALS INC',
        flights: [{
          icao24: 'a4caf6',
          estDepartureAirport: 'JFK',
          // estArrivalAirport: 'LGA'
        }]
      },
      {
        icao24: 'a2cdf6',
        callsign: 'NJ78GA',
        origin_country: 'United States',
        time_position: 1650308733,
        last_contact: 1650328734,
        longitude: longitude-0.0005,
        latitude: latitude-0.0005,
        baro_altitude: 105.26,
        on_ground: false,
        velocity: 23,
        true_track: 281,
        vertical_rate: 2.04,
        sensors: null,
        geo_altitude: 120.22,
        squawk: '1200',
        spi: false,
        position_source: 0,
        hovering_time: 820,
        photos: [],
        flights: [{
          icao24: 'a4caf6',
          estDepartureAirport: 'JFK',
          // estArrivalAirport: 'LGA'
        }]
      }];
    }

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
