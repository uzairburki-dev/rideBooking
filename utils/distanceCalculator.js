/**
 * Haversine Formula Distance Calculator Utility
 * Performs geographic distance calculation using latitude and longitude coordinates.
 */

/**
 * Calculates straight-line geographic distance in kilometers between two coordinates
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers rounded to 1 decimal place
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const p1Lat = parseFloat(lat1);
  const p1Lon = parseFloat(lon1);
  const p2Lat = parseFloat(lat2);
  const p2Lon = parseFloat(lon2);

  if (isNaN(p1Lat) || isNaN(p1Lon) || isNaN(p2Lat) || isNaN(p2Lon)) {
    return 0;
  }

  // Exact same point
  if (p1Lat === p2Lat && p1Lon === p2Lon) {
    return 0;
  }

  const EARTH_RADIUS_KM = 6371; // Earth's mean radius in kilometers

  const dLat = toRadians(p2Lat - p1Lat);
  const dLon = toRadians(p2Lon - p1Lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(p1Lat)) * Math.cos(toRadians(p2Lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 10) / 10;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Deterministic coordinate resolver for address strings if coordinates are not provided by client
 */
function getDemoCoordinates(addressString, defaultLat = 33.6844, defaultLng = 73.0479) {
  if (!addressString) {
    return { lat: defaultLat, lng: defaultLng };
  }

  const lower = addressString.trim().toLowerCase();

  // Preset Landmarks & Cities
  if (lower.includes('islamabad')) {
    return { lat: 33.6844, lng: 73.0479 };
  }
  if (lower.includes('rawalpindi')) {
    return { lat: 33.5651, lng: 73.0169 };
  }
  if (lower.includes('lahore')) {
    return { lat: 31.5204, lng: 74.3587 };
  }
  if (lower.includes('karachi')) {
    return { lat: 24.8607, lng: 67.0011 };
  }
  if (lower.includes('times square')) {
    return { lat: 40.7580, lng: -73.9855 };
  }
  if (lower.includes('jfk') || lower.includes('airport')) {
    return { lat: 40.6413, lng: -73.7781 };
  }
  if (lower.includes('central park')) {
    return { lat: 40.7812, lng: -73.9665 };
  }
  if (lower.includes('brooklyn')) {
    return { lat: 40.6782, lng: -73.9442 };
  }

  // Deterministic Hash Fallback
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash << 5) - hash + lower.charCodeAt(i);
    hash |= 0;
  }

  const latOffset = ((hash % 100) / 1000);
  const lngOffset = (((hash >> 2) % 100) / 1000);

  return {
    lat: Math.round((defaultLat + latOffset) * 10000) / 10000,
    lng: Math.round((defaultLng + lngOffset) * 10000) / 10000
  };
}

module.exports = {
  calculateHaversineDistance,
  getDemoCoordinates
};
