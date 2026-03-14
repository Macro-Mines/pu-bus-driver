import { useState, useEffect } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../services/firebase'
import { Phone, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginScreen({ onLoginSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      })
    }
  }, [])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier)
      setConfirmationResult(confirmation)
      setStep('otp')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to send OTP. Please try again.')
      if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear()
          window.recaptchaVerifier = null
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await confirmationResult.confirm(otp)
      onLoginSuccess()
    } catch (err) {
      console.error(err)
      setError('Invalid OTP. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f7f9fc]">
      <div id="recaptcha-container"></div>
      
      <div className="auth-card">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <Phone className="text-accent w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PU BUS Driver</h1>
          <p className="text-gray-500 mt-1">
            {step === 'phone' ? 'Enter your phone to continue' : 'Enter the 6-digit code sent'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder=""
                  className="input-field"
                  value={phoneNumber}
                  onChange={(e) => {
                    let val = e.target.value;
                    // If user clears or tries to delete prefix, let them, but we'll re-add if they type
                    if (val && !val.startsWith('+91')) {
                      // Only add if it doesn't already have it
                      const digits = val.replace(/\D/g, '');
                      setPhoneNumber('+91' + digits);
                    } else {
                      setPhoneNumber(val);
                    }
                  }}
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="btn-primary flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">OTP Code</label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
              {!loading && <CheckCircle className="w-5 h-5" />}
            </button>
            <button 
              type="button" 
              className="w-full text-center text-sm font-medium text-accent"
              onClick={() => setStep('phone')}
            >
              Change Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
