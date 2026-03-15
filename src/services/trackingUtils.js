import { STOPS, ROUTES } from '../data/demoData';

// Haversine formula to calculate distance in km between two coordinates
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Calculates the next stop and estimated arrival based on current location and route.
 * @param {number} lat - Current latitude
 * @param {number} lng - Current longitude
 * @param {number} speed - Current speed in km/h
 * @param {string} routeId - ID of the active route
 * @returns {Object} - { nextStopId, etaSeconds, distanceToStopKm }
 */
export function calculateNextStop(lat, lng, speed, routeId) {
  const route = ROUTES[routeId];
  if (!route || !route.path) return null;

  const path = route.path;
  
  // 1. Find the index on the path closest to current location
  let minDistance = Infinity;
  let currentIndex = 0;

  for (let i = 0; i < path.length; i++) {
    const dist = getDistance(lat, lng, path[i].lat, path[i].lng);
    if (dist < minDistance) {
      minDistance = dist;
      currentIndex = i;
    }
  }

  // 2. Look forward in the path to find the next stop
  // We compare path coordinates with STOPS to find matches
  const stopsEntries = Object.entries(STOPS);
  let nextStopId = null;
  let distanceToStopKm = 0;

  // Track the cumulative distance along the path segments
  let cumulativeDist = getDistance(lat, lng, path[currentIndex].lat, path[currentIndex].lng);

  for (let i = currentIndex; i < path.length; i++) {
    // Check if this path point is a stop
    const stopMatch = stopsEntries.find(([id, stop]) => {
      // Small epsilon check for coordinate matching (approx 1 meter)
      return Math.abs(stop.lat - path[i].lat) < 0.00001 && 
             Math.abs(stop.lng - path[i].lng) < 0.00001;
    });

    if (stopMatch) {
      // If we are extremely close to the current point and it's a stop, 
      // but we're moving away, we might want the NEXT stop.
      // For simplicity: if we are at index i and it's a stop, it's the next stop.
      nextStopId = stopMatch[0];
      break;
    }

    // Add distance to the next segment
    if (i < path.length - 1) {
      cumulativeDist += getDistance(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
    }
  }

  // If no stop found ahead (end of path), use the last stop in the route sequence
  if (!nextStopId) {
    nextStopId = route.stops[route.stops.length - 1];
  }

  // 3. Calculate ETA
  // Use a fallback speed if the bus is stopped or speed is very low
  const effectiveSpeed = speed > 5 ? speed : 20; // fallback to 20km/h
  const timeHours = cumulativeDist / effectiveSpeed;
  const etaSeconds = Math.round(timeHours * 3600);

  return {
    nextStopId,
    etaSeconds,
    distanceToStopKm: cumulativeDist
  };
}
