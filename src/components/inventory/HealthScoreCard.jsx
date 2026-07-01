import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'

export default function HealthScoreCard({
  health,
}) {
  const color =
    health.score >= 85
      ? '#5FD97A'
      : health.score >= 60
      ? '#F0A93D'
      : '#FF6B5B'

  return (
    <Card
      style={{
        marginBottom: 22,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--text-low)',
              fontWeight: 600,
            }}
          >
            Inventory Health
          </p>

          <h1
            style={{
              margin: '8px 0 0',
              fontSize: 58,
              lineHeight: 1,
              color,
            }}
          >
            {health.score}%
          </h1>

          <p
            style={{
              marginTop: 10,
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-hi)',
            }}
          >
            {health.label}
          </p>
        </div>

        <Badge
          variant={
            health.score >= 85
              ? 'ok'
              : health.score >= 60
              ? 'warn'
              : 'red'
          }
        >
          LIVE
        </Badge>
      </div>

      <ProgressBar
        value={health.score}
        color={color}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 18,
          marginTop: 22,
        }}
      >
        <div>
          <small
            style={{
              color: 'var(--text-low)',
            }}
          >
            Low Stock
          </small>

          <h3
            style={{
              margin: '6px 0 0',
            }}
          >
            {health.lowStock}
          </h3>
        </div>

        <div>
          <small
            style={{
              color: 'var(--text-low)',
            }}
          >
            Out of Stock
          </small>

          <h3
            style={{
              margin: '6px 0 0',
            }}
          >
            {health.outOfStock}
          </h3>
        </div>

        <div>
          <small
            style={{
              color: 'var(--text-low)',
            }}
          >
            Dead Stock
          </small>

          <h3
            style={{
              margin: '6px 0 0',
            }}
          >
            {health.inactive}
          </h3>
        </div>
      </div>
    </Card>
  )
}
