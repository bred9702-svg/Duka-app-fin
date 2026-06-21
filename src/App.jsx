import { Routes, Route, useLocation } from 'react-router-dom'
import HomeScreen from './screens/HomeScreen'
import TransactionsScreen from './screens/TransactionsScreen'
import ClassifyScreen from './screens/ClassifyScreen'
import DebtsScreen from './screens/DebtsScreen'
import CustomerDetailScreen from './screens/CustomerDetailScreen'
import SettingsScreen from './screens/SettingsScreen'
import BottomNav from './components/BottomNav'

export default function App() {
  const location = useLocation()
  const hideNav =
    location.pathname.startsWith('/classify') ||
    location.pathname.startsWith('/customer')

  return (
    <div className="app-shell">
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/inbox" element={<TransactionsScreen />} />
          <Route path="/classify/:id" element={<ClassifyScreen />} />
          <Route path="/debts" element={<DebtsScreen />} />
          <Route path="/customer/:id" element={<CustomerDetailScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
