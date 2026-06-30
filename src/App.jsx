import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import useAppStore from './store/useAppStore'

import HomeScreen from './screens/HomeScreen'
import TransactionsScreen from './screens/TransactionsScreen'
import ClassifyScreen from './screens/ClassifyScreen'
import DebtsScreen from './screens/DebtsScreen'
import CustomerDetailScreen from './screens/CustomerDetailScreen'
import SettingsScreen from './screens/SettingsScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'
import InventoryInsightsScreen from './screens/InventoryInsightsScreen'

import BottomNav from './components/BottomNav'

function LoadingScreen() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-deep)',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid var(--line)',
          borderTopColor: '#F0A93D',
          animation: 'spin 0.8s linear infinite',
        }}
      />

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          color: 'var(--text-low)',
          fontWeight: 500,
        }}
      >
        Loading your shop...
      </p>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  const bootstrap = useAppStore((s) => s.bootstrap)
  const loading = useAppStore((s) => s.loading)

  useEffect(() => {
    bootstrap()
  }, [])

  const hideNav =
    location.pathname.startsWith('/classify') ||
    location.pathname.startsWith('/customer')

  if (loading) {
    return (
      <div className="app-shell">
        <LoadingScreen />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <Routes>
          <Route path="/" element={<HomeScreen />} />

          <Route path="/inbox" element={<TransactionsScreen />} />

          <Route path="/classify/:id" element={<ClassifyScreen />} />

          <Route path="/debts" element={<DebtsScreen />} />

          <Route
            path="/customer/:id"
            element={<CustomerDetailScreen />}
          />

          <Route
            path="/analytics"
            element={<AnalyticsScreen />}
          />

          <Route
            path="/inventory"
            element={<InventoryInsightsScreen />}
          />

          <Route
            path="/settings"
            element={<SettingsScreen />}
          />
        </Routes>
      </div>

      {!hideNav && <BottomNav />}
    </div>
  )
}
