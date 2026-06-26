import Card from '../components/ui/Card'
import useAppStore from '../store/useAppStore'
import Icon from '../components/ui/Icon'

export default function SettingsScreen() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
<div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 120, height: 120, top: -20, right: -30, background: 'rgba(240,169,61,0.18)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', marginBottom: 16 }}>
          Settings
        </h1>

        {/* Theme toggle */}
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Appearance
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <div
            onClick={() => setTheme('dark')}
            style={{
              background: theme === 'dark' ? 'rgba(240,169,61,0.15)' : 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: theme === 'dark' ? '1.5px solid rgba(240,169,61,0.5)' : '1px solid var(--glass-border)',
              borderRadius: 14,
              padding: '14px 12px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🌙</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: theme === 'dark' ? '#F0A93D' : 'var(--text-hi)' }}>
              Dark
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>Warm black</p>
            {theme === 'dark' && (
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                <Icon name="circleCheck" size={16} color="#F0A93D" />
              </div>
            )}
          </div>
          <div
            onClick={() => setTheme('light')}
            style={{
              background: theme === 'light' ? 'rgba(240,169,61,0.15)' : 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: theme === 'light' ? '1.5px solid rgba(240,169,61,0.5)' : '1px solid var(--glass-border)',
              borderRadius: 14,
              padding: '14px 12px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>☀️</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: theme === 'light' ? '#F0A93D' : 'var(--text-hi)' }}>
              Light
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>Warm cream</p>
            {theme === 'light' && (
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                <Icon name="circleCheck" size={16} color="#F0A93D" />
              </div>
            )}
          </div>
        </div>

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Shop info
        </p>
        <Card style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)', marginBottom: 4 }}>Shop name</p>
          <p style={{ fontSize: 13, color: 'var(--text-low)' }}>My Wines &amp; Spirits</p>
        </Card>
        <Card style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)', marginBottom: 4 }}>Currency</p>
          <p style={{ fontSize: 13, color: 'var(--text-low)' }}>KES — Kenyan Shilling</p>
        </Card>
        <Card style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)', marginBottom: 4 }}>Version</p>
          <p style={{ fontSize: 13, color: 'var(--text-low)' }}>Duka v0.3</p>
        </Card>

        <p style={{ fontSize: 11, color: 'var(--text-low)', textAlign: 'center', marginTop: 24 }}>
          Built for East African shop owners
        </p>
      </div>
    </div>
  )
}
