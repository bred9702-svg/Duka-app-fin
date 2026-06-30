import Card from '../ui/Card'

export default function AIAdvisorCard({
  insights = [],
}) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-low)',
          marginBottom: 14,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          fontWeight: 600,
        }}
      >
        Duka AI Advisor
      </p>

      {insights.length === 0 ? (
        <p
          style={{
            margin: 0,
            color: 'var(--text-low)',
          }}
        >
          No recommendations available.
        </p>
      ) : (
        insights.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 0',
              borderBottom:
                index === insights.length - 1
                  ? 'none'
                  : '1px solid rgba(255,255,255,.08)',
            }}
          >
            <span
              style={{
                fontSize: 20,
              }}
            >
              {item.icon}
            </span>

            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-hi)',
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                {item.message}
              </p>
            </div>
          </div>
        ))
      )}
    </Card>
  )
}
