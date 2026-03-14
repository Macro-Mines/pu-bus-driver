import DriverDashboard from './components/DriverDashboard'
import './index.css'

function App() {
  // Auth bypassed for localhost development — will add proper auth later
  const mockUser = { uid: 'dev-driver-001', displayName: 'Dev Driver' }

  return (
    <div className="app-container">
      <DriverDashboard user={mockUser} />
    </div>
  )
}

export default App
