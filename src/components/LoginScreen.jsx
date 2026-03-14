import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { ref, get } from 'firebase/database'
import { auth, rtdb } from '../services/firebase'
import { Bus, CheckCircle, AlertCircle, Lock } from 'lucide-react'

export default function LoginScreen({ onLoginSuccess }) {
  const [busNumber, setBusNumber] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Format the bus number into the internal email structure
    // e.g., "01" becomes "bus01@pubus.in"
    // e.g., "12A" becomes "bus12a@pubus.in"
    const cleanedId = busNumber.trim()
    const formattedEmail = `bus${cleanedId.toLowerCase()}@pubus.in`
    const trackingId = `BUS${cleanedId.toUpperCase()}`

    try {
      // 1. Check if another instance is actively using this ID
      const activeRef = ref(rtdb, `active_logins/${trackingId}`)
      const snapshot = await get(activeRef)
      if (snapshot.exists()) {
        setError('This Bus ID is currently logged in on another device.')
        setLoading(false)
        return
      }

      // 2. If free, proceed with authentication
      await signInWithEmailAndPassword(auth, formattedEmail, password)
      if (onLoginSuccess) {
        onLoginSuccess()
      }
    } catch (err) {
      console.error("Login mapping error for", formattedEmail, ":", err)
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid Bus Number or Password. Please try again.')
      } else {
        setError(err.message || 'Failed to login. Please check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f7f9fc]">
      <div className="auth-card">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <Bus className="text-accent w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PU BUS Driver</h1>
          <p className="text-gray-500 mt-1">
            Enter your assigned Bus ID & PIN
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bus Number (e.g., 01, 12, 1A)</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="01"
                className="input-field pl-16 uppercase"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">6-Digit Password/PIN</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                placeholder="••••••"
                className="input-field pl-12 text-center text-xl tracking-[0.2em] font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary flex items-center justify-center gap-2 mt-4"
            disabled={loading || !busNumber || !password}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
            {!loading && <CheckCircle className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  )
}

