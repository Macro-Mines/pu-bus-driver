import { useState, useEffect, useRef } from 'react'
import { ref, set, onValue, remove } from 'firebase/database'
import { rtdb } from '../services/firebase'
import { calculateNextStop } from '../services/trackingUtils'

export function useTracking(busId, isTracking, routeId) {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const watchId = useRef(null)
  const lastSyncTime = useRef(0)
  const lastIndex = useRef(0)
  const wakeLock = useRef(null)
  const audioContext = useRef(null)

  // Manage Silent Audio Loop for Background Priority
  useEffect(() => {
    let interval = null;

    const startSilentAudio = () => {
      try {
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        const buffer = audioContext.current.createBuffer(1, audioContext.current.sampleRate, audioContext.current.sampleRate);
        
        const playSilence = () => {
          if (!audioContext.current || !isTracking) return;
          const source = audioContext.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.current.destination);
          source.start();
        };

        playSilence();
        interval = setInterval(playSilence, 10000);

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new window.MediaMetadata({
            title: 'PU BUS tracking active',
            artist: 'Driver Dashboard',
            album: 'Background Persistence'
          });
          navigator.mediaSession.playbackState = 'playing';
        }
      } catch (err) {
        console.error("Audio Context error:", err);
      }
    };

    if (isTracking) {
      startSilentAudio();
    } else {
      if (interval) clearInterval(interval);
      if (audioContext.current) {
        audioContext.current.close().catch(console.error);
        audioContext.current = null;
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioContext.current) {
        audioContext.current.close().catch(console.error);
      }
    };
  }, [isTracking]);

  // Manage Screen Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isTracking) {
          wakeLock.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    if (isTracking) {
      requestWakeLock();
    } else {
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
      }
    }

    const handleVisibilityChange = () => {
      if (wakeLock.current !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock.current) {
        wakeLock.current.release();
      }
    };
  }, [isTracking]);

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
          setLocation({ lat: latitude, lng: longitude, speed: speed || 0 })

          const now = Date.now()
          if (now - lastSyncTime.current >= 1000) {
            const trackingResult = calculateNextStop(
              latitude, 
              longitude, 
              speed || 0, 
              routeId || 'university_route', 
              lastIndex.current
            );
            
            if (trackingResult?.currentIndex !== undefined) {
              lastIndex.current = trackingResult.currentIndex;
            }

            const busRef = ref(rtdb, `buses/${busId}`)
            set(busRef, {
              ...newLoc,
              route_id: routeId || 'university_route',
              next_stop: trackingResult?.nextStopId || null,
              last_stop: trackingResult?.lastStopId || null,
              direction: trackingResult?.direction || 'forward',
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
  }, [isTracking, busId, routeId])

  return { location, error }
}
