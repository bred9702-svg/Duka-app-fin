import Card from '../ui/Card'
import Badge from '../ui/Badge'

export default function RecommendationCard({
  lowStock,
  outOfStock,
}) {
  let icon = '✅'
  let title = 'Inventory Healthy'
  let message = 'Everything looks good. No action required today.'
  let badge = 'GOOD'
  let badgeVariant = 'ok'
  let color = '#5FD97A'

  if (outOfStock.length > 0) {
    icon = '🚨'
    title = 'Restock Immediately'
    message = `${outOfStock.length} product(s) are out of stock. Restock as soon as possible.`
    badge = 'URGENT'
    badgeVariant = 'red'
    color = '#FF6B5B'
  } else if (lowStock.length > 0) {
    icon = '📦'
    title = 'Prepare Restock'
    message = `${lowStock.length} product(s) are running low. Plan your next purchase.`
    badge = 'ACTION'
    badgeVariant = 'warn'
    color = '#F0A93D'
  }

  return (
    <Card
      style={{
        marginBottom: 16,
        padding: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
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
          Recommendation
        </p>

        <Badge variant={badgeVariant}>
          {badge}
        </Badge>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            fontSize: 20,
            lineHeight: 1,
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color,
            }}
          >
            {title}
          </p>

          <p
            style={{
              margin: '5px 0 0',
              fontSize: 11,
              lineHeight: 1.45,
              color: 'var(--text-mid)',
            }}
          >
            {message}
          </p>
        </div>
      </div>
    </Card>
  )
}
