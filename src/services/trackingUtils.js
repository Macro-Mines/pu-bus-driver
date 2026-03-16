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
 * @param {number} lastIndex - The previous index on the path
 * @returns {Object} - { nextStopId, lastStopId, direction, etaSeconds, distanceToStopKm, currentIndex }
 */
export function calculateNextStop(lat, lng, speed, routeId, lastIndex = 0) {
  const route = ROUTES[routeId];
  if (!route || !route.path) return null;

  const path = route.path;
  
  // 1. Find all candidate indices within a reasonable distance (e.g., 100m)
  const threshold = 0.1; // 100 meters
  let candidates = [];

  for (let i = 0; i < path.length; i++) {
    const dist = getDistance(lat, lng, path[i].lat, path[i].lng);
    if (dist < threshold) {
      candidates.push({ index: i, dist });
    }
  }

  // 2. Resolve direction using Temporal Continuity
  // We prefer an index that is "just ahead" of our last index
  let currentIndex = lastIndex;

  if (candidates.length > 0) {
    // Sort by proximity to lastIndex
    candidates.sort((a, b) => {
      // Logic: preferred index is one that is >= lastIndex and closest to it
      // or if at terminal, the next index in sequence
      const diffA = (a.index - lastIndex + path.length) % path.length;
      const diffB = (b.index - lastIndex + path.length) % path.length;
      return diffA - diffB;
    });
    
    // Pick the best candidate (the one least "jerk" forward)
    currentIndex = candidates[0].index;
  } else {
    // No candidates near? Reset to the globally closest point
    let minGlobalDist = Infinity;
    for (let i = 0; i < path.length; i++) {
        const dist = getDistance(lat, lng, path[i].lat, path[i].lng);
        if (dist < minGlobalDist) {
            minGlobalDist = dist;
            currentIndex = i;
        }
    }
  }

  // 3. Determine direction based on index
  // 0-25: Forward Leg
  // 26-50: Return Leg
  const direction = currentIndex <= 25 ? 'forward' : 'backward';

  // 4. Look forward in the path to find the next stop
  const stopsEntries = Object.entries(STOPS);
  let nextStopId = null;
  let lastStopId = null;
  let distanceToStopKm = 0;

  // Track the cumulative distance along path segments
  let cumulativeDist = getDistance(lat, lng, path[currentIndex].lat, path[currentIndex].lng);

  for (let i = currentIndex; i < path.length; i++) {
    const stopMatch = stopsEntries.find(([id, stop]) => {
      return Math.abs(stop.lat - path[i].lat) < 0.00001 && 
             Math.abs(stop.lng - path[i].lng) < 0.00001;
    });

    if (stopMatch) {
      nextStopId = stopMatch[0];
      break;
    }

    if (i < path.length - 1) {
      cumulativeDist += getDistance(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
    }
  }

  // 5. Look backward in the path to find the last stop
  for (let i = currentIndex; i >= 0; i--) {
    const stopMatch = stopsEntries.find(([id, stop]) => {
      return Math.abs(stop.lat - path[i].lat) < 0.00001 && 
             Math.abs(stop.lng - path[i].lng) < 0.00001;
    });

    if (stopMatch) {
      lastStopId = stopMatch[0];
      break;
    }
  }

  // Fallbacks
  if (!nextStopId) {
    nextStopId = direction === 'forward' ? 'stop_014' : 'stop_001';
  }
  if (!lastStopId) {
    lastStopId = direction === 'forward' ? 'stop_001' : 'stop_014';
  }

  const effectiveSpeed = speed > 5 ? speed : 20; 
  const timeHours = cumulativeDist / effectiveSpeed;
  const etaSeconds = Math.round(timeHours * 3600);

  return {
    nextStopId,
    lastStopId,
    direction,
    etaSeconds,
    distanceToStopKm: cumulativeDist,
    currentIndex
  };
}
