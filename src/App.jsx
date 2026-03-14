import { useState, useEffect } from 'react'
import { auth } from './services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import LoginScreen from './components/LoginScreen'
import DriverDashboard from './components/DriverDashboard'
import './index.css'

function App() {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      if (initializing) setInitializing(false)
    })
    return unsubscribe
  }, [initializing])

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {user ? (
        <DriverDashboard user={user} />
      ) : (
        <LoginScreen onLoginSuccess={() => {}} />
      )}
    </div>
  )
}

export default App
