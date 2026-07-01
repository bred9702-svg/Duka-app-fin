import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'

export default function HealthScoreCard({ health }) {
  const color =
    health.score >= 85
      ? '#5FD97A'
      : health.score >= 60
      ? '#F0A93D'
      : '#FF6B5B'

  return (
    <Card
      style={{
        marginBottom: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
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
              margin: '4px 0 2px',
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1,
              color,
              fontFamily: 'var(--font-display)',
            }}
          >
            {health.score}%
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text-mid)',
              fontWeight: 500,
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

      <div
        style={{
          marginBottom: 14,
        }}
      >
        <ProgressBar
          value={health.score}
          color={color}
          height={6}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 8,
        }}
      >
        <Metric
          label="Low"
          value={health.lowStock}
          color="#F0A93D"
        />

        <Metric
          label="Out"
          value={health.outOfStock}
          color="#FF6B5B"
        />

        <Metric
          label="Dead"
          value={health.inactive}
          color="#5B9FF0"
        />
      </div>
    </Card>
  )
}

function Metric({
  label,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 10,
        padding: '8px 10px',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 9,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: '5px 0 0',
          fontSize: 18,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </p>
    </div>
  )
}
