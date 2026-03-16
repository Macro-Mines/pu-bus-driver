
const { calculateNextStop, getDistance } = require('./trackingUtils.js');
const { STOPS, ROUTES } = require('../data/demoData.js');

// Mock data for testing since we are in Node environment
global.STOPS = STOPS;
global.ROUTES = ROUTES;

function test() {
  const routeId = 'university_route';
  const path = ROUTES[routeId].path;

  console.log("--- TEST 1: Forward Direction (Start of Path) ---");
  const loc1 = path[0]; // Library
  const res1 = calculateNextStop(loc1.lat, loc1.lng, 20, routeId);
  console.log(`Pos: ${loc1.lat}, ${loc1.lng}`);
  console.log(`Direction: ${res1.direction} (Expected: forward)`);
  console.log(`Next Stop: ${res1.nextStopId} (Expected: stop_002)`);
  console.log(`Last Stop: ${res1.lastStopId} (Expected: stop_001)`);

  console.log("\n--- TEST 2: Mid Forward (Health Centre) ---");
  const loc2 = path[5]; // Health Centre index in path is around here
  const res2 = calculateNextStop(loc2.lat, loc2.lng, 20, routeId);
  console.log(`Direction: ${res2.direction} (Expected: forward)`);
  console.log(`Next Stop: ${res2.nextStopId}`);

  console.log("\n--- TEST 3: Near Terminal (UNESCO) ---");
  const loc3 = path[25]; // UNESCO index
  const res3 = calculateNextStop(loc3.lat, loc3.lng, 20, routeId);
  console.log(`Direction: ${res3.direction} (Expected: forward/backward transition)`);
  console.log(`Next Stop: ${res3.nextStopId}`);

  console.log("\n--- TEST 4: Return Leg (Mega Mess) ---");
  const loc4 = path[35]; // Some point on return path
  const res4 = calculateNextStop(loc4.lat, loc4.lng, 20, routeId);
  console.log(`Direction: ${res4.direction} (Expected: backward)`);
  console.log(`Next Stop: ${res4.nextStopId}`);
  console.log(`Last Stop: ${res4.lastStopId}`);
}

try {
    test();
} catch (e) {
    console.error(e);
}
