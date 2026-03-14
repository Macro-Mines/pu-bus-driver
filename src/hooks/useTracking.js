import { useState, useEffect, useRef } from 'react'
import { ref, set, onValue, remove } from 'firebase/database'
import { rtdb } from '../services/firebase'

export function useTracking(busId, isTracking) {
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

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords
          const newLoc = { lat: latitude, lng: longitude, speed: speed || 0 }
          setLocation(newLoc)

          // Sync with Firebase every 5 seconds
          const now = Date.now()
          if (now - lastSyncTime.current >= 5000) {
            const busRef = ref(rtdb, `buses/${busId}`)
            set(busRef, {
              ...newLoc,
              last_updated: now,
              bus_id: busId, // Just in case
            })
            lastSyncTime.current = now
          }
        },
        (err) => {
          console.error("Geolocation error:", err)
          setError(err.message)
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000 
        }
      )
    } else {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
    }

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [isTracking, busId])

  return { location, error }
}
