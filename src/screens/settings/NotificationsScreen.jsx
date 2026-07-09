import { useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import Toggle from '../../components/ui/Toggle'

const STORAGE_KEY = 'duka-notifications'

const DEFAULTS = {
  lowStock: true,
  newDebt: true,
  paymentReceived: true,
  dailySummary: false,
  weeklyReport: true,
}

const ITEMS = [
  { id: 'lowStock', label: 'Low stock', sub: 'When a product is running low', icon: 'package', color: '#F0A93D' },
  { id: 'newDebt', label: 'New debt', sub: 'When a customer owes you money', icon: 'userDollar', color: '#FF6B5B' },
  { id: 'paymentReceived', label: 'Payment received', sub: 'When a debt is paid off', icon: 'cash', color: '#5FD97A' },
  { id: 'dailySummary', label: 'Daily summary', sub: 'Recap of the day, every evening', icon: 'barChart', color: '#5B9FF0' },
  { id: 'weeklyReport', label: 'Weekly report', sub: 'Performance recap every Monday', icon: 'trendingUp', color: '#7C5CFC' },
]

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState(loadPrefs)

  function toggle(id) {
    const next = { ...prefs, [id]: !prefs[id] }
    setPrefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Notifications" />

        {ITEMS.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px',
              borderRadius: 12,
              marginBottom: 8,
              background: 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div style={{ width: 30, height: 30, borderRadius: 9, background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={item.icon} size={14} color={item.color} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>{item.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-low)' }}>{item.sub}</p>
            </div>
            <Toggle checked={prefs[item.id]} onChange={() => toggle(item.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
