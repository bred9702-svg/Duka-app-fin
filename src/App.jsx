import { useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'

import HomeScreen from './screens/HomeScreen'
import TransactionsScreen from './screens/TransactionsScreen'
import ClassifyScreen from './screens/ClassifyScreen'
import DebtsScreen from './screens/DebtsScreen'
import CustomerDetailScreen from './screens/CustomerDetailScreen'

import AnalyticsScreen from './screens/AnalyticsScreen'
import FinancialAnalysisScreen from './screens/FinancialAnalysisScreen'
import BusinessTrendsScreen from './screens/BusinessTrendsScreen'
import AdvisorScreen from './screens/AdvisorScreen'
import DukaAIScreen from './screens/DukaAIScreen'
import InventoryInvestmentScreen from './screens/InventoryInvestmentScreen'
import NewSaleScreen from './screens/NewSaleScreen'
import NewDebtScreen from './screens/NewDebtScreen'
import InventoryInsightsScreen from './screens/InventoryInsightsScreen'
import InsightsScreen from './screens/InsightsScreen'
import MeScreen from './screens/MeScreen'
import NotificationCenterScreen from './screens/NotificationCenterScreen'
import EmployeesScreen from './screens/EmployeesScreen'
import EmployeePerformanceScreen from './screens/EmployeePerformanceScreen'

import ShopProfileScreen from './screens/settings/ShopProfileScreen'
import PaymentModeScreen from './screens/settings/PaymentModeScreen'
import StoreSettingsScreen from './screens/settings/StoreSettingsScreen'
import NotificationsScreen from './screens/settings/NotificationsScreen'
import ThemeScreen from './screens/settings/ThemeScreen'
import HelpScreen from './screens/settings/HelpScreen'
import FAQScreen from './screens/settings/FAQScreen'
import TermsScreen from './screens/settings/TermsScreen'
import PrivacyScreen from './screens/settings/PrivacyScreen'
import AccountScreen from './screens/settings/AccountScreen'
import SubscriptionScreen from './screens/settings/SubscriptionScreen'

import BottomNav from './components/BottomNav'
import FadeIn from './components/animation/FadeIn'
import RequireOwner from './components/auth/RequireOwner'
import RequireEntitlement from './components/auth/RequireEntitlement'
import InAppNotification from './components/notifications/InAppNotification'

import SplashScreen from './screens/onboarding/SplashScreen'
import WelcomeScreen from './screens/onboarding/WelcomeScreen'
import OwnerRegistrationScreen from './screens/onboarding/OwnerRegistrationScreen'
import InitialInventorySetupScreen from './screens/onboarding/InitialInventorySetupScreen'
import SignInScreen from './screens/onboarding/SignInScreen'

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
  const navigate = useNavigate()

  const bootstrap = useAppStore((s) => s.bootstrap)
  const loading = useAppStore((s) => s.loading)
  const session = useAppStore((s) => s.session)

  useEffect(() => {
    bootstrap()
  }, [])

  const ONBOARDING_PATHS = ['/splash', '/welcome', '/register', '/setup-inventory', '/sign-in']
  const isOnboardingRoute = ONBOARDING_PATHS.some((p) => location.pathname.startsWith(p))

  // Frontend-only auth guard: no valid, onboarded session and not already
  // on an onboarding screen → send the merchant through Splash first.
  useEffect(() => {
    if (loading) return

    const needsOnboarding = !session || !session.isOnboarded

    if (needsOnboarding && !isOnboardingRoute) {
      navigate('/splash', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, location.pathname])

  const hideNav =
    isOnboardingRoute ||
    location.pathname.startsWith('/classify') ||
    location.pathname.startsWith('/new-debt') ||
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
      <InAppNotification />

      <div
        className="app-content"
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          paddingBottom: hideNav ? 0 : 84,
        }}
      >
        <FadeIn
          key={location.pathname}
          duration={260}
          y={14}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            width: '100%',
          }}
        >
          <Routes>
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/register" element={<OwnerRegistrationScreen />} />
            <Route path="/setup-inventory" element={<InitialInventorySetupScreen />} />
            <Route path="/sign-in" element={<SignInScreen />} />

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
              element={
                <RequireOwner title="Analytics">
                  <RequireEntitlement feature="advanced_analytics" title="Advanced Analytics"><AnalyticsScreen /></RequireEntitlement>
                </RequireOwner>
              }
            />

            <Route
              path="/inventory"
              element={
                <RequireOwner title="Inventory Insights">
                  <RequireEntitlement feature="smart_insights" title="Inventory Intelligence"><InventoryInsightsScreen /></RequireEntitlement>
                </RequireOwner>
              }
            />

            <Route
              path="/finance"
              element={
                <RequireOwner title="Financial Analysis">
                  <RequireEntitlement feature="advanced_reports" title="Financial Analysis"><FinancialAnalysisScreen /></RequireEntitlement>
                </RequireOwner>
              }
            />

            <Route
              path="/trends"
              element={
                <RequireOwner title="Business Trends">
                  <RequireEntitlement feature="advanced_analytics" title="Business Trends"><BusinessTrendsScreen /></RequireEntitlement>
                </RequireOwner>
              }
            />

            <Route
              path="/advisor"
              element={
                <RequireOwner title="AI Advisor">
                  <RequireEntitlement feature="smart_insights" title="AI Advisor"><AdvisorScreen /></RequireEntitlement>
                </RequireOwner>
              }
            />

            <Route
              path="/duka-ai"
              element={
                <RequireOwner title="Dukwise AI">
                  <RequireEntitlement feature="smart_insights" title="Dukwise AI"><DukaAIScreen /></RequireEntitlement>
                </RequireOwner>
              }
            />

            <Route
              path="/inventory-investment"
              element={
                <RequireOwner title="Inventory Investment">
                  <InventoryInvestmentScreen />
                </RequireOwner>
              }
            />

            <Route
              path="/new-sale"
              element={<NewSaleScreen />}
            />

            <Route
              path="/new-debt"
              element={<NewDebtScreen />}
            />

            <Route
              path="/me"
              element={<MeScreen />}
            />

            <Route
              path="/notification-center"
              element={<NotificationCenterScreen />}
            />

            <Route
              path="/employees"
              element={
                <RequireOwner title="Employees">
                  <EmployeesScreen />
                </RequireOwner>
              }
            />

            <Route
              path="/employee-performance"
              element={
                <RequireOwner title="Employee Performance">
                  <RequireEntitlement feature="employees" title="Employee Performance"><EmployeePerformanceScreen /></RequireEntitlement>
                </RequireOwner>
              }
            />

            <Route
              path="/shop"
              element={
                <RequireOwner title="Shop Profile">
                  <ShopProfileScreen />
                </RequireOwner>
              }
            />
            <Route
              path="/payment-mode"
              element={
                <RequireOwner title="Payment Mode">
                  <PaymentModeScreen />
                </RequireOwner>
              }
            />

            <Route
              path="/business-preferences"
              element={
                <RequireOwner title="Store Settings">
                  <StoreSettingsScreen />
                </RequireOwner>
              }
            />

            <Route path="/notifications" element={<NotificationsScreen />} />
            <Route path="/appearance" element={<ThemeScreen />} />
            <Route path="/help" element={<HelpScreen />} />
            <Route path="/faq" element={<FAQScreen />} />
            <Route path="/terms" element={<TermsScreen />} />
            <Route path="/privacy" element={<PrivacyScreen />} />
            <Route path="/account" element={<AccountScreen />} />
            <Route
              path="/subscription"
              element={
                <RequireOwner title="Subscription">
                  <SubscriptionScreen />
                </RequireOwner>
              }
            />
          </Routes>
        </FadeIn>
      </div>

      {!hideNav && <BottomNav />}
    </div>
  )
}
