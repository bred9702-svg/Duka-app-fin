import { useNavigate } from 'react-router-dom'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'

const ITEMS = [
  { label: 'FAQ', sub: 'Common questions answered', icon: 'helpCircle', color: '#F0A93D', path: '/faq' },
  { label: 'Contact us', sub: 'Reach the Duka team', icon: 'phone', color: '#5B9FF0', action: () => {} },
  { label: 'WhatsApp', sub: 'Chat with support', icon: 'phone', color: '#5FD97A', action: () => window.open('https://wa.me/+254742599719) },
  { label: 'Email', sub: 'support@duka.app', icon: 'inbox', color: '#7C5CFC', action: () => window.location.href = 'mailto:support@duka.app' },
]

export default function HelpScreen() {
  const navigate = useNavigate()

  function handleItemClick(item) {
    if (item.path) {
      navigate(item.path)
      return
    }

    item.action?.()
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Help" />

        {ITEMS.map((item) => (
          <div
            key={item.label}
            onClick={() => handleItemClick(item)}
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
      </div>
    </div>
  )
}
