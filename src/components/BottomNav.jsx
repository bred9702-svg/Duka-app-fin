import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './ui/Icon'
import useAppStore from '../store/useAppStore'

const TABS = [
  { id: 'home', path: '/', icon: 'home', label: 'Home' },
  { id: 'inbox', path: '/inbox', icon: 'inbox', label: 'Inbox' },
  { id: 'debts', path: '/debts', icon: 'users', label: 'Debts' },
  { id: 'settings', path: '/settings', icon: 'settings', label: 'Settings' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const transactions = useAppStore((s) => s.transactions)
  const unclassifiedCount = transactions.filter((t) => !t.classified).length

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        margin: '0 12px 12px',
        padding: '10px 6px',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 18,
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {TABS.map((tab) => {
        const active = location.pathname === tab.path
        return (
          <div
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              padding: active ? '5px 12px' : '5px 10px',
              background: active ? 'rgba(240,169,61,0.22)' : 'transparent',
              borderRadius: 10,
              transition: 'background .15s',
            }}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon
                name={tab.icon}
                size={18}
                color={active ? '#F0A93D' : 'var(--text-low)'}
              />
              {tab.id === 'inbox' && unclassifiedCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -5,
                    width: 7,
                    height: 7,
                    background: '#FF6B5B',
                    borderRadius: '50%',
                    boxShadow: '0 0 6px rgba(255,107,91,0.7)',
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 8,
                color: active ? '#F0A93D' : 'var(--text-low)',
                fontWeight: 600,
              }}
            >
              {tab.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
