import { useState, useEffect } from 'react'
import { auth, db, rtdb } from '../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { ref, onDisconnect, remove, runTransaction, onValue } from 'firebase/database'
import { useTracking } from '../hooks/useTracking'
import { LogOut, Play, Square, MapPin, Navigation, User, Bus } from 'lucide-react'

export default function DriverDashboard({ user }) {
  const [driverData, setDriverData] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDriver() {
      if (user?.uid) {
        try {
          // Check drivers collection for this UID
          const dRef = doc(db, 'drivers', user.uid)
          const dSnap = await getDoc(dRef)
          if (dSnap.exists()) {
            setDriverData(dSnap.data())
          } else {
            // Default/Fallback data for demo
            const emailBusId = user.email ? user.email.split('@')[0].toUpperCase() : 'BUS_XX'
            setDriverData({
              name: "Bus Driver",
              bus_id: emailBusId
            })
          }
        } catch (err) {
          console.error("Error fetching driver data:", err)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchDriver()
  }, [user])

  // Extract BUS_XX from bus01@pubus.in for clean tracking ID
  const trackingId = user?.email ? user.email.split('@')[0].toUpperCase() : user?.uid

  useEffect(() => {
    if (!trackingId) return

    const activeRef = ref(rtdb, `active_logins/${trackingId}`)
    // Create a unique session ID for this specific browser/login instance
    const sessionId = Math.random().toString(36).substring(2, 15)
    let disconnectRef = null

    // Attempt to acquire the lock using a transaction
    runTransaction(activeRef, (currentData) => {
      // If null, no one is logged in, or if it's somehow already our session, claim it
      if (currentData === null || currentData === sessionId) {
        return sessionId
      }
      // Otherwise, someone else is logged in; abort transaction
      return
    }).then((result) => {
      if (!result.committed) {
        // The lock is already held by another device
        alert("This Bus ID is currently logged in on another device.")
        auth.signOut()
      } else {
        // We successfully acquired the lock!
        disconnectRef = onDisconnect(activeRef)
        // Auto-remove if connection unexpectedly drops
        disconnectRef.remove().catch(console.error)
      }
    }).catch(console.error)

    // Listen to changes on the lock to detect if another device forcibly takes it
    // or if the lock is somehow lost while we are still here.
    const unsubscribe = onValue(activeRef, (snapshot) => {
      const currentLoc = snapshot.val()
      // If the lock changes to someone else's sessionId, kick this device out
      if (currentLoc !== null && currentLoc !== sessionId) {
        alert("Your session was terminated because this Bus ID logged in on another device.")
        auth.signOut()
      }
    })

    return () => {
      // Clean up on component unmount (e.g., explicit logout)
      unsubscribe() // Stop listening to lock changes
      remove(activeRef).catch(console.error)
      if (disconnectRef) {
        disconnectRef.cancel()
      }
    }
  }, [trackingId])

  const { location, error: trackingError } = useTracking(
    trackingId,
    isTracking
  )

  const handleLogout = () => {
    if (isTracking) {
      alert("Please stop the trip before signing out.")
      return
    }
    auth.signOut()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-900 border-t-transparent"></div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 selection:bg-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white border border-zinc-200 shadow-sm rounded-full flex items-center justify-center text-zinc-900">
            <User className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight leading-none mb-1.5">
              {driverData?.name || 'Driver'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Bus className="w-3.5 h-3.5" /> 
              <span>{driverData?.bus_id || 'No Bus Assigned'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors active:scale-95"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 stroke-[1.5]" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-md mx-auto w-full">

        {/* Status Card */}
        <div className={`p-6 rounded-3xl border transition-all duration-500 flex items-center gap-5 relative overflow-hidden ${
          isTracking 
            ? 'bg-emerald-50 border-emerald-200 shadow-[0_8px_30px_rgb(16,185,129,0.12)]' 
            : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          {isTracking && (
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          )}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border ${
            isTracking 
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30' 
              : 'bg-zinc-100 text-zinc-400 border-zinc-200'
          }`}>
            <Navigation className={`w-6 h-6 stroke-[1.5] ${isTracking ? 'animate-pulse' : ''}`} />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-1">
              Trip Status
            </p>
            <h3 className={`text-xl font-bold tracking-tight ${isTracking ? 'text-emerald-700' : 'text-zinc-400'}`}>
              {isTracking ? 'LIVE TRACKING' : 'OFFLINE'}
            </h3>
          </div>
        </div>

        {/* Location Display */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 text-zinc-700">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 stroke-[1.5] text-zinc-600" />
            </div>
            <span className="text-sm font-semibold tracking-wide">LIVE COORDINATES</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50/50 border border-zinc-100 p-5 rounded-2xl transition-colors hover:bg-zinc-50">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mb-2">Latitude</p>
              <p className="text-xl font-mono text-zinc-900 tracking-tight">
                {location?.lat?.toFixed(6) || '—.——————'}
              </p>
            </div>
            <div className="bg-zinc-50/50 border border-zinc-100 p-5 rounded-2xl transition-colors hover:bg-zinc-50">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mb-2">Longitude</p>
              <p className="text-xl font-mono text-zinc-900 tracking-tight">
                {location?.lng?.toFixed(6) || '—.——————'}
              </p>
            </div>
          </div>

          {trackingError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-2xl flex items-start gap-3 mt-2">
               <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                 <span className="text-rose-600 font-bold text-xs">!</span>
               </div>
              <p className="leading-relaxed font-medium">Error: {trackingError}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-auto pt-8 pb-6">
          {!isTracking ? (
            <button
              onClick={() => setIsTracking(true)}
              className="w-full relative group overflow-hidden bg-zinc-900 text-white py-5 rounded-[2rem] text-lg font-semibold shadow-xl shadow-zinc-900/20 active:scale-[0.98] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <div className="relative z-10 flex items-center justify-center gap-3">
                <Play className="w-5 h-5 fill-current" />
                <span>START TRIP</span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setIsTracking(false)}
              className="w-full relative group overflow-hidden bg-rose-600 text-white py-5 rounded-[2rem] text-lg font-semibold shadow-xl shadow-rose-600/20 active:scale-[0.98] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <div className="relative z-10 flex items-center justify-center gap-3">
                <Square className="w-5 h-5 fill-current" />
                <span>STOP TRIP</span>
              </div>
            </button>
          )}
          <p className="text-center text-[13px] text-zinc-400 mt-6 leading-relaxed px-6 font-medium">
            Coordinates are updated every 5 seconds to the central system for student tracking.
          </p>
        </div>
      </main>
    </div>
  )
}
