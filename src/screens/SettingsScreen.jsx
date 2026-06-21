import Card from '../components/ui/Card'

export default function SettingsScreen() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 120, height: 120, top: -20, right: -30, background: 'rgba(240,169,61,0.18)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 21,
            fontWeight: 700,
            color: 'var(--text-hi)',
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          Settings
        </h1>

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
          <p style={{ fontSize: 13, color: 'var(--text-low)' }}>Duka v0.2 — dark glass</p>
        </Card>

        <p
          style={{
            fontSize: 11,
            color: 'var(--text-low)',
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          Built for East African shop owners
        </p>
      </div>
    </div>
  )
}
