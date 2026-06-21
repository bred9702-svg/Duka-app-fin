import Card from './Card'

const COLORS = {
  green: '#5FD97A',
  red: '#FF6B5B',
  amber: '#FFD98A',
  default: 'var(--text-hi)',
}

export default function StatCard({ label, value, sub, color = 'default', delay = 0 }) {
  const isAlert = color === 'red'
  return (
    <Card
      style={{
        padding: '11px 12px',
        animation: 'slideUp 0.5s ease-out backwards',
        animationDelay: `${delay}s`,
        ...(isAlert ? { borderColor: 'rgba(255,107,91,0.4)' } : {}),
      }}
    >
      <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: COLORS[color] || COLORS.default,
          marginBottom: 2,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 9, color: 'var(--text-low)' }}>{sub}</p>
      )}
    </Card>
  )
}
