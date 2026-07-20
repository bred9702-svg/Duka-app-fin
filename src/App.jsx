import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'

import BottomNav from './components/BottomNav'
import FadeIn from './components/animation/FadeIn'
import RequireOwner from './components/auth/RequireOwner'
import RequireEntitlement from './components/auth/RequireEntitlement'
import InAppNotification from './components/notifications/InAppNotification'
import { initializePushNotifications } from './lib/pushNotifications'

const HomeScreen = lazy(() => import('./screens/HomeScreen'))
const TransactionsScreen = lazy(() => import('./screens/TransactionsScreen'))
const ClassifyScreen = lazy(() => import('./screens/ClassifyScreen'))
const DebtsScreen = lazy(() => import('./screens/DebtsScreen'))
const CustomerDetailScreen = lazy(() => import('./screens/CustomerDetailScreen'))
const AnalyticsScreen = lazy(() => import('./screens/AnalyticsScreen'))
const FinancialAnalysisScreen = lazy(() => import('./screens/FinancialAnalysisScreen'))
const BusinessTrendsScreen = lazy(() => import('./screens/BusinessTrendsScreen'))
const DukaAIScreen = lazy(() => import('./screens/DukaAIScreen'))
const InventoryInvestmentScreen = lazy(() => import('./screens/InventoryInvestmentScreen'))
const StockPurchaseHistoryScreen = lazy(() => import('./screens/StockPurchaseHistoryScreen'))
const StockPurchaseDetailScreen = lazy(() => import('./screens/StockPurchaseDetailScreen'))
const NewSaleScreen = lazy(() => import('./screens/NewSaleScreen'))
const NewDebtScreen = lazy(() => import('./screens/NewDebtScreen'))
const PendingOrdersScreen = lazy(() => import('./screens/PendingOrdersScreen'))
const NewPendingOrderScreen = lazy(() => import('./screens/NewPendingOrderScreen'))
const PendingOrderDetailScreen = lazy(() => import('./screens/PendingOrderDetailScreen'))
const InventoryInsightsScreen = lazy(() => import('./screens/InventoryInsightsScreen'))
const InsightsScreen = lazy(() => import('./screens/InsightsScreen'))
const MeScreen = lazy(() => import('./screens/MeScreen'))
const NotificationCenterScreen = lazy(() => import('./screens/NotificationCenterScreen'))
const EmployeesScreen = lazy(() => import('./screens/EmployeesScreen'))
const EmployeePerformanceScreen = lazy(() => import('./screens/EmployeePerformanceScreen'))
const ShopProfileScreen = lazy(() => import('./screens/settings/ShopProfileScreen'))
const PaymentModeScreen = lazy(() => import('./screens/settings/PaymentModeScreen'))
const StoreSettingsScreen = lazy(() => import('./screens/settings/StoreSettingsScreen'))
const NotificationsScreen = lazy(() => import('./screens/settings/NotificationsScreen'))
const ThemeScreen = lazy(() => import('./screens/settings/ThemeScreen'))
const HelpScreen = lazy(() => import('./screens/settings/HelpScreen'))
const FAQScreen = lazy(() => import('./screens/settings/FAQScreen'))
const TermsScreen = lazy(() => import('./screens/settings/TermsScreen'))
const PrivacyScreen = lazy(() => import('./screens/settings/PrivacyScreen'))
const AccountScreen = lazy(() => import('./screens/settings/AccountScreen'))
const SubscriptionScreen = lazy(() => import('./screens/settings/SubscriptionScreen'))
const SplashScreen = lazy(() => import('./screens/onboarding/SplashScreen'))
const WelcomeScreen = lazy(() => import('./screens/onboarding/WelcomeScreen'))
const OwnerRegistrationScreen = lazy(() => import('./screens/onboarding/OwnerRegistrationScreen'))
const InitialInventorySetupScreen = lazy(() => import('./screens/onboarding/InitialInventorySetupScreen'))
const CatalogInventorySetupScreen = lazy(() => import('./screens/onboarding/CatalogInventorySetupScreen'))
const SignInScreen = lazy(() => import('./screens/onboarding/SignInScreen'))

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

  // Never prompts on startup. Existing permission is reused silently; the
  // explicit permission request remains on the Notifications settings screen.
  useEffect(() => {
    if (!session?.authUserId || !session?.shopId) return undefined

    let cancelled = false
    initializePushNotifications(session).catch((error) => {
      if (!cancelled) console.error('Push notification initialization failed:', error)
    })

    return () => {
      cancelled = true
    }
  }, [session?.authUserId, session?.shopId])

  const ONBOARDING_PATHS = ['/splash', '/welcome', '/register', '/setup-inventory', '/catalog-inventory', '/sign-in']
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
    || location.pathname.startsWith('/orders/new')
    || /^\/orders\/.+/.test(location.pathname)
    || location.pathname.startsWith('/inventory-purchase-history')

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
          <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/register" element={<OwnerRegistrationScreen />} />
            <Route path="/setup-inventory" element={<InitialInventorySetupScreen />} />
            <Route
              path="/catalog-inventory"
              element={
                <RequireOwner title="Opening Inventory">
                  <CatalogInventorySetupScreen />
                </RequireOwner>
              }
            />
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
                <RequireOwner title="Dukwise AI">
                  <RequireEntitlement feature="smart_insights" title="Dukwise AI"><DukaAIScreen /></RequireEntitlement>
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
              path="/inventory-purchase-history"
              element={
                <RequireOwner title="Stock Purchase History">
                  <StockPurchaseHistoryScreen />
                </RequireOwner>
              }
            />

            <Route
              path="/inventory-purchase-history/:id"
              element={
                <RequireOwner title="Stock Purchase Details">
                  <StockPurchaseDetailScreen />
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

            <Route path="/orders" element={<PendingOrdersScreen />} />
            <Route path="/orders/new" element={<NewPendingOrderScreen />} />
            <Route path="/orders/:id" element={<PendingOrderDetailScreen />} />

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
          </Suspense>
        </FadeIn>
      </div>

      {!hideNav && <BottomNav />}
    </div>
  )
}
