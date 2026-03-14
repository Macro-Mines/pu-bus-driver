import { useState, useEffect } from 'react'
import { auth, db, rtdb } from '../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { ref, set, onDisconnect, remove } from 'firebase/database'
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
    
    // Set this device as the active session
    set(activeRef, true).catch(console.error)
    
    // Auto-remove if connection unexpectedly drops
    const disconnectRef = onDisconnect(activeRef)
    disconnectRef.remove().catch(console.error)

    return () => {
      // Clean up on component unmount (e.g., explicit logout)
      remove(activeRef).catch(console.error)
      disconnectRef.cancel()
    }
  }, [trackingId])

  const { location, error: trackingError } = useTracking(
    trackingId, 
    isTracking
  )

  const handleLogout = () => auth.signOut()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fc]">
      {/* Header */}
      <header className="bg-white p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">
              {driverData?.name || 'Driver'}
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Bus className="w-3 h-3" /> {driverData?.bus_id || 'No Bus Assigned'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-danger transition-colors"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col gap-6">
        
        {/* Status Card */}
        <div className={`p-6 rounded-2xl shadow-md flex items-center gap-4 transition-all ${isTracking ? 'bg-success/10 border-2 border-success/30' : 'bg-white'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isTracking ? 'bg-success text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Trip Status
            </p>
            <h3 className={`text-xl font-bold ${isTracking ? 'text-success' : 'text-gray-400'}`}>
              {isTracking ? 'LIVE TRACKING' : 'OFFLINE'}
            </h3>
          </div>
        </div>

        {/* Location Display */}
        <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center gap-2 text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-semibold">LIVE COORDINATES</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Latitude</p>
              <p className="text-lg font-mono font-bold text-gray-800">
                {location?.lat?.toFixed(6) || '—.——————'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Longitude</p>
              <p className="text-lg font-mono font-bold text-gray-800">
                {location?.lng?.toFixed(6) || '—.——————'}
              </p>
            </div>
          </div>

          {trackingError && (
            <div className="p-3 bg-danger/10 text-danger text-xs rounded-lg font-medium">
              Error: {trackingError}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-auto pb-6">
          {!isTracking ? (
            <button 
              onClick={() => setIsTracking(true)}
              className="w-full bg-accent text-white py-6 rounded-2xl text-xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Play className="w-7 h-7 fill-white" />
              START TRIP
            </button>
          ) : (
            <button 
              onClick={() => setIsTracking(false)}
              className="w-full bg-danger text-white py-6 rounded-2xl text-xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Square className="w-7 h-7 fill-white" />
              STOP TRIP
            </button>
          )}
          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-4">
            Coordinates are updated every 5 seconds to the central system for student tracking.
          </p>
        </div>
      </main>
    </div>
  )
}
