import { useState, useRef } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../services/firebase'
import { Bus, CheckCircle, AlertCircle } from 'lucide-react'

export default function LoginScreen({ onLoginSuccess }) {
  const [busNumber, setBusNumber] = useState('')
  // PIN uses 6 digits
  const [pin, setPin] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef([])

  const handlePinChange = (index, value) => {
    // only allow numeric
    if (value && !/^\d+$/.test(value)) return
    if (value.length > 1) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    const pinStr = pin.join("")
    if (pinStr.length !== 6) {
      setError("Please enter the 6-digit PIN.")
      return
    }
    if (!busNumber.trim()) {
      setError("Please enter your Bus Number.")
      return
    }

    setLoading(true)
    setError('')

    const cleanedId = busNumber.trim()
    const formattedEmail = `bus${cleanedId.toLowerCase()}@pubus.in`

    try {
      await signInWithEmailAndPassword(auth, formattedEmail, pinStr)
      if (onLoginSuccess) {
        onLoginSuccess()
      }
    } catch (err) {
      console.error("Login mapping error for", formattedEmail, ":", err)
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid Bus Number or PIN. Please try again.')
      } else {
        setError(err.message || 'Failed to login. Please check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop"
            alt="Bus in City at Night"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-gray-900/90 to-black/95" />
        </div>

        <div className="relative z-10 p-8 py-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Driver Authentication</h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Enter your assigned Bus ID and<br />secure 6-digit PIN to access dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-center gap-3 text-red-200 text-sm shadow-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-white/70 text-xs font-semibold uppercase tracking-wider ml-1">Bus Number</label>
              <input
                type="text"
                placeholder="e.g. 01, 12, 1A"
                className="w-full h-14 px-4 text-xl font-medium uppercase bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 border shadow-inner opacity-100 rounded-2xl"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-white/70 text-xs font-semibold uppercase tracking-wider ml-1">Secure PIN</label>
              <div className="flex justify-between gap-2">
                {pin.map((digit, index) => (
                  <div key={index} className="relative flex-1">
                    <input
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-full h-14 text-center text-xl font-medium bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 border shadow-inner opacity-100 rounded-2xl"
                      placeholder="•"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 h-14 bg-white text-gray-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 focus:scale-[0.98] transition-all shadow-lg shadow-white/10 disabled:opacity-50 disabled:pointer-events-none"
              disabled={loading || !busNumber || pin.join("").length !== 6}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Verify & Login
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-white/40 text-xs leading-relaxed">
              PU BUS Security encrypted tracking system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
