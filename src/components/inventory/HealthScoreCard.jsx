import Card from '../ui/Card'

export default function HealthScoreCard({ health }) {
  return (
    <Card
      style={{
        marginBottom: 18,
        overflow: 'hidden',
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-low)',
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          fontWeight: 600,
        }}
      >
        Inventory Health
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 52,
              margin: 0,
              lineHeight: 1,
              color: health.color,
            }}
          >
            {health.score}%
          </h1>

          <p
            style={{
              marginTop: 8,
              fontWeight: 700,
              color: health.color,
            }}
          >
            {health.status}
          </p>
        </div>

        <div
          style={{
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 12,
            }}
          >
            <span>Total products</span>
            <strong>{health.totalProducts}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 12,
            }}
          >
            <span>Low stock</span>
            <strong>{health.lowStock}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
            }}
          >
            <span>Out of stock</span>
            <strong>{health.outOfStock}</strong>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          height: 8,
          borderRadius: 999,
          background: 'rgba(255,255,255,.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${health.score}%`,
            height: '100%',
            borderRadius: 999,
            background: health.color,
            transition: '.4s',
          }}
        />
      </div>
    </Card>
  )
}
