import * as turf from "@turf/turf";

function toRad(value) {
  return value * Math.PI / 180;
}

export function distance(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

export const getFlightPathPrediction = (
  currentPosition,
  velocity,
  duration,
  direction,
  steps
) => {
  const destination = turf.destination(
    currentPosition,
    velocity * duration,
    direction,
    {
      units: "meters"
    }
  );

  const route = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [currentPosition, destination.geometry.coordinates]
    }
  };

  const distance = turf.distance(currentPosition, destination, {
    units: "meters"
  });

  const arc = [];
  for (let i = 0; i < distance; i += distance / steps) {
    arc.push(
      turf.along(route, i, {
        units: "meters"
      })
    );
  }

  return arc;
};