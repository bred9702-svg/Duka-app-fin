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
        padding: '6px 6px',
        background:
          'linear-gradient(180deg, rgba(91,159,240,.05) 0%, rgba(6,7,10,.55) 100%)',
        backdropFilter: 'blur(26px) saturate(180%)',
        WebkitBackdropFilter: 'blur(26px) saturate(180%)',
        border: '1px solid rgba(140,180,255,.10)',
        borderRadius: 16,
        boxShadow:
          '0 20px 40px -14px rgba(0,0,0,.75), 0 2px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.10)',
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
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
                gap: 2,
                padding: '4px 4px',
                borderRadius: 10,
                background: active
                  ? 'linear-gradient(180deg, rgba(255,255,255,.20) 0%, rgba(255,255,255,.05) 100%)'
                  : 'transparent',
                backdropFilter: active
                  ? 'blur(14px) saturate(180%)'
                  : 'none',
                WebkitBackdropFilter: active
                  ? 'blur(14px) saturate(180%)'
                  : 'none',
                border: active
                  ? '1px solid rgba(255,255,255,.28)'
                  : '1px solid transparent',
                boxShadow: active
                  ? 'inset 0 1px 1px rgba(255,255,255,.5), inset 0 -2px 3px rgba(0,0,0,.25), 0 4px 14px -4px rgba(0,0,0,.4)'
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
