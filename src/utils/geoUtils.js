// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in km
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find nearby events using MongoDB geospatial query
const buildNearbyQuery = (coordinates, radiusKm = 50) => {
  return {
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates, // [longitude, latitude]
        },
        $maxDistance: radiusKm * 1000, // Convert km to meters
      },
    },
  };
};

module.exports = {
  calculateDistance,
  buildNearbyQuery,
};
