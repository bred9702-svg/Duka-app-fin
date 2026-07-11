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
    id: 'me',
    path: '/me',
    icon: 'settings',
    label: 'Me',
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const transactions = useAppStore((s) => s.transactions)
  const session = useAppStore((s) => s.session)

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
        left: 12,
        right: 12,
        bottom: 12,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 6px',
        background: 'rgba(18, 15, 10, 0.34)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.13)',
        borderRadius: 16,
        boxShadow: '0 18px 42px -18px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,255,255,.14)',
        flexShrink: 0,
        zIndex: 10,
        overflow: 'hidden',
        boxSizing: 'border-box',
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
              minWidth: 0,
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