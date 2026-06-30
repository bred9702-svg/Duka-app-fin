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
    path: '/inventory',
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

  const unclassifiedCount = transactions.filter(
    (t) => !t.classified
  ).length

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        margin: '0 12px 12px',
        padding: '10px 6px',
        background: 'rgba(255,255,255,.07)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        border: '1px solid rgba(255,255,255,.14)',
        borderRadius: 18,
        boxShadow:
          '0 10px 30px -10px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.18)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {TABS.map((tab) => {
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
                gap: 4,
                padding: '6px 4px',
                borderRadius: 12,
                background: active
                  ? 'rgba(240,169,61,.18)'
                  : 'transparent',
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
                  size={18}
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
                  fontSize: 9,
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
