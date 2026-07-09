import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'

export default function HealthScoreCard({ health }) {
  const color = '#F0A93D'

  return (
    <Card
      style={{
        marginBottom: 12,
        padding: 12,
        background: 'rgba(255,255,255,.02)',
        border: '1px solid rgba(255,255,255,.10)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: 'none',
      }}
    >
      <p
        style={{
          margin: '0 0 4px',
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          fontWeight: 600,
        }}
      >
        Inventory Health
      </p>

      <h1
        style={{
          margin: '0 0 6px',
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color,
        }}
      >
        {health.score}%
      </h1>

      <ProgressBar
        value={health.score}
        color={color}
        height={4}
      />
    </Card>
  )
}
