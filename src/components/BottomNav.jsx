import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './ui/Icon'
import useAppStore from '../store/useAppStore'

const TABS = [
  {
    id: 'home',
    path: '/',
    icon: 'home',
    label: 'Home',
  },
  {
    id: 'inbox',
    path: '/inbox',
    icon: 'inbox',
    label: 'Inbox',
  },
  {
    id: 'insights',
    path: '/insights',
    icon: 'pieChart',
    label: 'Insights',
  },
  {
    id: 'debts',
    path: '/debts',
    icon: 'users',
    label: 'Debts',
  },
  {
    id: 'orders',
    path: '/orders',
    icon: 'receiptOff',
    label: 'Orders',
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const transactions = useAppStore((s) => s.transactions)
  const session = useAppStore((s) => s.session)
  const pendingOrders = useAppStore((s) => s.pendingOrders)

  const visibleTabs = session?.role === 'employee'
    ? TABS.filter((tab) => tab.id !== 'insights')
    : TABS

  const unclassifiedCount = transactions.filter(
    (t) => !t.classified
  ).length

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        margin: '0 12px 12px',
        padding: '6px 6px',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(26px) saturate(180%)',
        WebkitBackdropFilter: 'blur(26px) saturate(180%)',
        border: '1px solid var(--nav-border)',
        borderRadius: 16,
        boxShadow: 'var(--nav-shadow)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {visibleTabs.map((tab) => {
        const active = location.pathname === tab.path

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '4px 4px',
                borderRadius: 10,
                background: active
                  ? 'var(--nav-active-bg)'
                  : 'transparent',
                backdropFilter: active
                  ? 'blur(14px) saturate(180%)'
                  : 'none',
                WebkitBackdropFilter: active
                  ? 'blur(14px) saturate(180%)'
                  : 'none',
                border: active
                  ? '1px solid var(--nav-active-border)'
                  : '1px solid transparent',
                boxShadow: active
                  ? 'var(--nav-active-shadow)'
                  : 'none',
                transition: '.18s',
              }}
            >
              <div
                style={{
                  position: 'relative',
                }}
              >
                <Icon
                  name={tab.icon}
                  size={16}
                  color={
                    active
                      ? '#F0A93D'
                      : 'var(--text-low)'
                  }
                />

                {tab.id === 'inbox' &&
                  unclassifiedCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -3,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#FF6B5B',
                      }}
                    />
                  )}
                {tab.id === 'orders' && pendingOrders.some((order) => ['awaiting_payment', 'partially_paid', 'paid'].includes(order.status)) && (
                  <span style={{ position: 'absolute', top: -2, right: -3, width: 8, height: 8, borderRadius: '50%', background: '#F0A93D' }} />
                )}
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 8,
                  fontWeight: 600,
                  color: active
                    ? '#F0A93D'
                    : 'var(--text-low)',
                }}
              >
                {tab.label}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
