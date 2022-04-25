const fetch = require('node-fetch').default;

// https://opensky-network.org/apidoc/rest.html
const apiBase = `https://opensky-network.org/api`;
const headers = {
  'Authorization': 'Basic ' + Buffer.from(process.env.OPENSKY_USERNAME + ":" + process.env.OPENSKY_PASSWORD).toString('base64'),
};

function makeURL(path) {
  return `${apiBase}${path}`;
}

async function request(url, options, retryCount) {
  const response = await fetch(url, options);

  if (!response.ok) {
    if (options.retry && options.retry > (retryCount || 0)) {
      if (options.pause && options.pause > 0) {
        await new Promise(resolve => setTimeout(resolve, options.pause));
      }
      return request(url, options, (retryCount || 0) + 1);
    } else {
      console.log(await response.text());
      let error = new Error(`${response.status} ${response.statusText}: ${url}`);
      error.status = response.status;
      throw error;
    }
  }

  return response;
}

module.exports = {
  // https://opensky-network.org/apidoc/rest.html#get-states
  states: async ({ lamin, lamax, lomin, lomax }) => {
    const url = makeURL(`/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`);

    try {
      const response = await request(url, { headers, retry: 5, pause: 1000 });
      const json = await response.json();

      if (!json.states) {
        return { time: json.time, states: [] }
      }

      return {
        time: json.time,
        states: json.states
          .map((state) => ({
            icao24: state[0],
            callsign: state[1],
            origin_country: state[2],
            time_position: state[3],
            last_contact: state[4],
            longitude: state[5],
            latitude: state[6],
            baro_altitude: state[7],
            on_ground: state[8],
            velocity: state[9],
            true_track: state[10],
            vertical_rate: state[11],
            sensors: state[12],
            geo_altitude: state[13],
            squawk: state[14],
            spi: state[15],
            position_source: state[16],
          }))
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  aircraft: async ({ icao24 }) => {
    let url = makeURL(`/metadata/aircraft/icao/${icao24}`);

    try {
      const response = await request(url, { headers, retry: 3, pause: 1000 });
      const json = await response.json();

      return json;
    } catch (error) {
      throw error;
    }
  },
  route: async ({ callsign }) => {
    let url = makeURL(`/routes?callsign=${callsign}`);

    try {
      const response = await request(url, { headers, retry: 3, pause: 1000 });
      const json = await response.json();

      if (!json.route) {
        return { route: [] }
      }

      return {
        route: json.route,
      }
    } catch (error) {
      return { route: [] }
    }
  }
};
