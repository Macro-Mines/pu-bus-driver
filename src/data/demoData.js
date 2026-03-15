/* ============================================
   PU BUS Tracker — Pondicherry University
   Real Campus Data: 14 Bus Stands & Single Route
   Optimized with Curve Checkpoints
   Bi-directional Path (1 -> 14 -> 1)
   ============================================ */

// Center point derived from the bounds of the provided coordinates
export const CAMPUS_CENTER = { lat: 12.025, lng: 79.853 }
export const DEFAULT_ZOOM = 15

export const STOPS = {
  stop_001: { id: 'stop_001', name: 'Library', lat: 12.020523, lng: 79.856310, routes: ['university_route'] },
  stop_002: { id: 'stop_002', name: 'Reading Room', lat: 12.020846, lng: 79.855354, routes: ['university_route'] },
  stop_003: { id: 'stop_003', name: 'Shopping Complex', lat: 12.017482, lng: 79.853662, routes: ['university_route'] },
  stop_004: { id: 'stop_004', name: 'Health Centre', lat: 12.019190, lng: 79.850368, routes: ['university_route'] },
  stop_005: { id: 'stop_005', name: 'Mother Teresa Mess', lat: 12.022273, lng: 79.848055, routes: ['university_route'] },
  stop_006: { id: 'stop_006', name: 'Narmada Hostel', lat: 12.022946, lng: 79.847169, routes: ['university_route'] },
  stop_007: { id: 'stop_007', name: 'MAKA Hostel', lat: 12.029539, lng: 79.848924, routes: ['university_route'] },
  stop_008: { id: 'stop_008', name: 'Amudham Mess', lat: 12.029693, lng: 79.850892, routes: ['university_route'] },
  stop_009: { id: 'stop_009', name: 'Mega Mess', lat: 12.029188, lng: 79.852368, routes: ['university_route'] },
  stop_010: { id: 'stop_010', name: 'Boys Tea Time', lat: 12.027674, lng: 79.853402, routes: ['university_route'] },
  stop_011: { id: 'stop_011', name: 'Food Science', lat: 12.028419, lng: 79.855489, routes: ['university_route'] },
  stop_012: { id: 'stop_012', name: 'Mass Media', lat: 12.032330, lng: 79.856865, routes: ['university_route'] },
  stop_013: { id: 'stop_013', name: 'SJ Bus Stop', lat: 12.033131, lng: 79.857597, routes: ['university_route'] },
  stop_014: { id: 'stop_014', name: 'UNESCO Bus Stop', lat: 12.031327, lng: 79.857984, routes: ['university_route'] }
}

export const ROUTES = {
  university_route: {
    id: 'university_route',
    name: 'University Campus Route',
    color: '#4361ee',
    description: 'Bi-directional campus shuttle connecting all departments and hostels',
    stops: Object.keys(STOPS),
    path: [
      // Forward Path: 1 -> 14
      { lat: 12.020523, lng: 79.856310 }, // 1. Library
      { lat: 12.020846, lng: 79.855354 }, // 2. Reading Room
      { lat: 12.020918, lng: 79.855107 }, // Checkpoint DMS Curve
      { lat: 12.017482, lng: 79.853662 }, // 3. Shopping Complex
      { lat: 12.018541, lng: 79.850744 }, // Checkpoint Staff Quarters Curve
      { lat: 12.019190, lng: 79.850368 }, // 4. Health Centre
      { lat: 12.021921, lng: 79.848978 }, // Checkpoint curve
      { lat: 12.022273, lng: 79.848055 }, // 5. Mother Teresa Mess
      { lat: 12.022540, lng: 79.847429 }, // Checkpoint curve
      { lat: 12.022946, lng: 79.847169 }, // 6. Narmada Hostel
      { lat: 12.024112, lng: 79.846629 }, // Checkpoint Kannagi Hostel
      { lat: 12.026538, lng: 79.847420 }, // Checkpoint OAT
      { lat: 12.029166, lng: 79.848368 }, // Checkpoint Multigame field
      { lat: 12.029539, lng: 79.848924 }, // 7. MAKA Hostel
      { lat: 12.030007, lng: 79.849891 }, // Checkpoint Boys Gym
      { lat: 12.029693, lng: 79.850892 }, // 8. Amudham Mess
      { lat: 12.029188, lng: 79.852368 }, // 9. Mega Mess
      { lat: 12.027674, lng: 79.853402 }, // 10. Boys Tea Time
      { lat: 12.028419, lng: 79.855489 }, // 11. Food Science
      { lat: 12.028834, lng: 79.856575 }, // Checkpoint KVS
      { lat: 12.030604, lng: 79.856850 }, // Checkpoint AP
      { lat: 12.031446, lng: 79.857302 }, // Checkpoint SJ inner circle
      { lat: 12.032330, lng: 79.856865 }, // 12. Mass Media
      { lat: 12.033131, lng: 79.857597 }, // 13. SJ Bus Stop
      { lat: 12.032327, lng: 79.858761 }, // Checkpoint UGC
      { lat: 12.031327, lng: 79.857984 }, // 14. UNESCO Bus Stop

      // Return Path: 14 -> 1 (Back along the same checkpoints)
      { lat: 12.032327, lng: 79.858761 }, // Checkpoint UGC
      { lat: 12.033131, lng: 79.857597 }, // 13. SJ Bus Stop
      { lat: 12.032330, lng: 79.856865 }, // 12. Mass Media
      { lat: 12.031446, lng: 79.857302 }, // Checkpoint SJ inner circle
      { lat: 12.030604, lng: 79.856850 }, // Checkpoint AP
      { lat: 12.028834, lng: 79.856575 }, // Checkpoint KVS
      { lat: 12.028419, lng: 79.855489 }, // 11. Food Science
      { lat: 12.027674, lng: 79.853402 }, // 10. Boys Tea Time
      { lat: 12.029188, lng: 79.852368 }, // 9. Mega Mess
      { lat: 12.029693, lng: 79.850892 }, // 8. Amudham Mess
      { lat: 12.030007, lng: 79.849891 }, // Checkpoint Boys Gym
      { lat: 12.029539, lng: 79.848924 }, // 7. MAKA Hostel
      { lat: 12.029166, lng: 79.848368 }, // Checkpoint Multigame field
      { lat: 12.026538, lng: 79.847420 }, // Checkpoint OAT
      { lat: 12.024112, lng: 79.846629 }, // Checkpoint Kannagi Hostel
      { lat: 12.022946, lng: 79.847169 }, // 6. Narmada Hostel
      { lat: 12.022540, lng: 79.847429 }, // Checkpoint curve
      { lat: 12.022273, lng: 79.848055 }, // 5. Mother Teresa Mess
      { lat: 12.021921, lng: 79.848978 }, // Checkpoint curve
      { lat: 12.019190, lng: 79.850368 }, // 4. Health Centre
      { lat: 12.018541, lng: 79.850744 }, // Checkpoint Staff Quarters Curve
      { lat: 12.017482, lng: 79.853662 }, // 3. Shopping Complex
      { lat: 12.020918, lng: 79.855107 }, // Checkpoint DMS Curve
      { lat: 12.020846, lng: 79.855354 }, // 2. Reading Room
      { lat: 12.020523, lng: 79.856310 }  // 1. Library
    ],
    schedule: { start: '07:30', end: '21:00', frequency: 10 }
  }
}
