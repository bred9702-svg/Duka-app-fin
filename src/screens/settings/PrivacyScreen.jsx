import { useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'

const ITEMS = [
  { label: 'Terms of Service', sub: 'How Duka works', icon: 'edit', color: '#5B9FF0' },
  { label: 'Privacy Policy', sub: 'How your data is used', icon: 'shield', color: '#5FD97A' },
  { label: 'Export Data', sub: 'Download a copy of your data', icon: 'package', color: '#7C5CFC' },
]

export default function PrivacyScreen() {
  const [confirming, setConfirming] = useState(false)

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Privacy" />

        {ITEMS.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px',
              borderRadius: 12,
              marginBottom: 8,
              cursor: 'pointer',
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
            <Icon name="chevronRight" size={15} color="var(--text-low)" />
          </div>
        ))}

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: '#FF6B5B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 8px' }}>
          Danger zone
        </p>

        <div
          onClick={() => setConfirming(!confirming)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px',
            borderRadius: 12,
            cursor: 'pointer',
            background: 'rgba(255,107,91,0.08)',
            border: '1px solid rgba(255,107,91,0.25)',
          }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,107,91,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="trash" size={14} color="#FF6B5B" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#FF6B5B' }}>Delete Account</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-low)' }}>
              {confirming ? 'Tap again to confirm — this cannot be undone' : 'Permanently erase your shop data'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
