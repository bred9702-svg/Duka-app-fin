import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import useAppStore from '../../store/useAppStore'

const OPTIONS = [
  { id: 'dark', label: 'Dark', sub: 'Warm black', bg: '#0F1117', card: '#1C1C1C', text: '#FBF6E9' },
  { id: 'light', label: 'Light', sub: 'Warm cream', bg: '#F5EFE3', card: '#FFFFFF', text: '#1C1810' },
  { id: 'system', label: 'System', sub: 'Match device', bg: 'linear-gradient(90deg,#0F1117 50%,#F5EFE3 50%)', card: '#888', text: '#fff' },
]

export default function ThemeScreen() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Theme" />

        {OPTIONS.map((opt) => (
          <div
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px',
              borderRadius: 14,
              marginBottom: 10,
              cursor: 'pointer',
              background: theme === opt.id ? 'rgba(240,169,61,0.12)' : 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: theme === opt.id ? '1.5px solid rgba(240,169,61,0.5)' : '1px solid var(--glass-border)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 40,
                borderRadius: 10,
                background: opt.bg,
                border: '1px solid rgba(255,255,255,.1)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: 30, height: 20, borderRadius: 5, background: opt.card, opacity: 0.85 }} />
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: theme === opt.id ? '#F0A93D' : 'var(--text-hi)' }}>
                {opt.label}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-low)' }}>{opt.sub}</p>
            </div>

            {theme === opt.id && <Icon name="circleCheck" size={18} color="#F0A93D" />}
          </div>
        ))}
      </div>
    </div>
  )
}
