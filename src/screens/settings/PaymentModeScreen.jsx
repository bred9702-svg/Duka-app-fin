import { useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import Toggle from '../../components/ui/Toggle'

const STORAGE_KEY = 'duka-payment-methods'

const METHODS = [
  { id: 'cash', label: 'Cash', icon: 'cash', color: '#5FD97A' },
  { id: 'mpesa', label: 'M-Pesa', icon: 'phone', color: '#F0A93D' },
  { id: 'card', label: 'Card', icon: 'userDollar', color: '#5B9FF0' },
  { id: 'bank', label: 'Bank Transfer', icon: 'barChart', color: '#7C5CFC' },
  { id: 'credit', label: 'Credit', icon: 'coins', color: '#FF6B5B' },
]

const DEFAULTS = { cash: true, mpesa: true, card: true, bank: false, credit: false }

function loadEnabled() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export default function PaymentModeScreen() {
  const [enabled, setEnabled] = useState(loadEnabled)

  function toggle(id) {
    const next = { ...enabled, [id]: !enabled[id] }
    setEnabled(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const activeCount = Object.values(enabled).filter(Boolean).length

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Payment Mode" />

        <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 14 }}>
          {activeCount} payment method{activeCount !== 1 ? 's' : ''} accepted at checkout
        </p>

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Payment methods
        </p>

        {METHODS.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px',
              borderRadius: 12,
              marginBottom: 8,
              background: enabled[m.id] ? `${m.color}12` : 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: enabled[m.id] ? `1px solid ${m.color}40` : '1px solid var(--glass-border)',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: `${m.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={m.icon} size={14} color={m.color} />
            </div>

            <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>
              {m.label}
            </p>

            <Toggle checked={enabled[m.id]} onChange={() => toggle(m.id)} />
          </div>
        ))}

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 8px' }}>
          M-Pesa settings
        </p>

        <div
          style={{
            padding: '12px',
            borderRadius: 12,
            background: 'var(--glass-fill-soft)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid var(--glass-border)',
            opacity: enabled.mpesa ? 1 : 0.4,
            pointerEvents: enabled.mpesa ? 'auto' : 'none',
          }}
        >
          <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Till / Paybill number</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>Connected via Africa's Talking SMS</p>
        </div>
      </div>
    </div>
  )
}
