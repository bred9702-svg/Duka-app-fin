import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import useAppStore from './store/useAppStore'

import HomeScreen from './screens/HomeScreen'
import TransactionsScreen from './screens/TransactionsScreen'
import ClassifyScreen from './screens/ClassifyScreen'
import DebtsScreen from './screens/DebtsScreen'
import CustomerDetailScreen from './screens/CustomerDetailScreen'

import AnalyticsScreen from './screens/AnalyticsScreen'
import FinancialAnalysisScreen from './screens/FinancialAnalysisScreen'
import BusinessTrendsScreen from './screens/BusinessTrendsScreen'
import InventoryInsightsScreen from './screens/InventoryInsightsScreen'
import InsightsScreen from './screens/InsightsScreen'
import MeScreen from './screens/MeScreen'

import ShopProfileScreen from './screens/settings/ShopProfileScreen'
import PaymentModeScreen from './screens/settings/PaymentModeScreen'
import StoreSettingsScreen from './screens/settings/StoreSettingsScreen'
import NotificationsScreen from './screens/settings/NotificationsScreen'
import ThemeScreen from './screens/settings/ThemeScreen'
import LanguageScreen from './screens/settings/LanguageScreen'
import HelpScreen from './screens/settings/HelpScreen'
import PrivacyScreen from './screens/settings/PrivacyScreen'

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
          animation: 'spin .8s linear infinite',
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
          paddingBottom: hideNav ? 0 : 84,
        }}
      >
        <Routes>
          <Route path="/" element={<HomeScreen />} />

          <Route
            path="/inbox"
            element={<TransactionsScreen />}
          />

          <Route
            path="/classify/:id"
            element={<ClassifyScreen />}
          />

          <Route
            path="/debts"
            element={<DebtsScreen />}
          />

          <Route
            path="/customer/:id"
            element={<CustomerDetailScreen />}
          />

          <Route
            path="/insights"
            element={<InsightsScreen />}
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
            path="/finance"
            element={<FinancialAnalysisScreen />}
          />

          <Route
            path="/trends"
            element={<BusinessTrendsScreen />}
          />

          <Route
            path="/me"
            element={<MeScreen />}
          />

          <Route path="/shop" element={<ShopProfileScreen />} />
          <Route path="/payment-mode" element={<PaymentModeScreen />} />
          <Route path="/business-preferences" element={<StoreSettingsScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="/appearance" element={<ThemeScreen />} />
          <Route path="/language" element={<LanguageScreen />} />
          <Route path="/help" element={<HelpScreen />} />
          <Route path="/privacy" element={<PrivacyScreen />} />
        </Routes>
      </div>

      {!hideNav && <BottomNav />}
    </div>
  )
}
