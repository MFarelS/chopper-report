const nodeFetch = require('node-fetch');
const bbox = require('@turf/bbox').default;
const buffer = require('@turf/buffer').default;
const circle = require('@turf/circle').default;
const square = require('@turf/square').default;
const turf = require('@turf/helpers');

// https://opensky-network.org/apidoc/rest.html
const apiBase = `https://opensky-network.org/api`;
const headers = {
    'Authorization': 'Basic ' + Buffer.from(process.env.OPENSKY_USERNAME + ":" + process.env.OPENSKY_PASSWORD).toString('base64'),
};

function getBoundingBox(lat, lon, radius) {
    const point = turf.point([lat, lon]);
    const buffered = circle(point, radius / 1000, { units: 'kilometers', steps: 8 });
    const box = square(bbox(buffered));
    
    return {
        lamin: box[0],
        lamax: box[2],
        lomin: box[1],
        lomax: box[3]
    }
}

function isInsideBoundingBox(lat, lon, bbox) {
    return lat >= bbox.lamin && lat <= bbox.lamax && lon >= bbox.lomin && lon <= bbox.lomax;
}

function makeURL(path) {
    return `${apiBase}${path}`;
}

async function fetch(url, options, retryCount) {
    const response = await nodeFetch(url, options);

    if (!response.ok) {
        if (options.retry && options.retry > (retryCount || 0)) {
            if (options.pause && options.pause > 0) {
                await new Promise(resolve => setTimeout(resolve, options.pause));
            }
            return fetch(url, options, (retryCount || 0) + 1);
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
    states: async ({ lat, lon, radius, time, icao24 }) => {
        let url = null;
        
        if (lat && lon && radius) {
            const { lamin, lamax, lomin, lomax } = getBoundingBox(parseFloat(lat), parseFloat(lon), radius);
            url = makeURL(`/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`);

            if (icao24) {
                url += `&icao24=${icao24}`;
            }
        } else if (icao24) {
            url = makeURL(`/states/all?icao24=${icao24}`);
        }

        if (time) {
            url += `&time=${time}`;
        }
        
        try {
            const response = await fetch(url, { headers, retry: 10, pause: 1000 });
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
                    // .filter((state) => isInsideBoundingBox(state.latitude, state.longitude, { lamin, lamax, lomin, lomax }))
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    aircraft: async ({ icao24 }) => {
        let url = makeURL(`/metadata/aircraft/icao/${icao24}`);

        try {
            const response = await fetch(url, { headers, retry: 3, pause: 1000 });
            const json = await response.json();

            return json;
        } catch (error) {
            throw error;
        }
    },
    route: async ({ callsign }) => {
        let url = makeURL(`/routes?callsign=${callsign}`);

        try {
            const response = await fetch(url, { headers, retry: 3, pause: 1000 });
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
