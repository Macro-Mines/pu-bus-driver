import { useState, useEffect, useRef } from 'react'
import { ref, set, onValue, remove } from 'firebase/database'
import { rtdb } from '../services/firebase'
import { calculateNextStop } from '../services/trackingUtils'

export function useTracking(busId, isTracking, routeId) {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const watchId = useRef(null)
  const lastSyncTime = useRef(0)

  useEffect(() => {
    if (isTracking && busId) {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.")
        return
      }

      setError(null)

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords
          const newLoc = { latitude, longitude, speed: speed || 0 }
          setLocation({ lat: latitude, lng: longitude, speed: speed || 0 }) // Keep lat/lng for local state

          // Sync with Firebase every 1 second for "no latency" feel
          const now = Date.now()
          if (now - lastSyncTime.current >= 1000) {
            // Calculate next stop and ETA
            const trackingResult = calculateNextStop(latitude, longitude, speed || 0, routeId || 'university_route');
            
            const busRef = ref(rtdb, `buses/${busId}`)
            set(busRef, {
              ...newLoc,
              route_id: routeId || 'university_route',
              next_stop: trackingResult?.nextStopId || null,
              eta_next_stop_seconds: trackingResult?.etaSeconds || 0,
              last_updated: now,
              bus_id: busId,
            })
            lastSyncTime.current = now
          }
        },
        (err) => {
          console.error("Geolocation error:", err)
          setError({ message: err.message, code: err.code })
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 20000
        }
      )
    } else {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      // Remove bus from RTDB so student app stops showing it
      if (busId) {
        remove(ref(rtdb, `buses/${busId}`))
      }
      setLocation(null)
    }

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [isTracking, busId])

  return { location, error }
}
