import Card from '../ui/Card'

export default function RecommendationCard({
  lowStock,
  outOfStock,
}) {
  let message =
    'Excellent. Your inventory is healthy.'

  let color = '#5FD97A'

  if (outOfStock.length > 0) {
    color = '#FF5C5C'
    message = `Restock ${outOfStock.length} product(s) immediately.`
  } else if (lowStock.length > 0) {
    color = '#F0A93D'
    message = `Plan a purchase order. ${lowStock.length} product(s) are running low.`
  }

  return (
    <Card>
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-low)',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          fontWeight: 600,
        }}
      >
        AI Recommendation
      </p>

      <p
        style={{
          margin: 0,
          fontWeight: 600,
          color,
        }}
      >
        {message}
      </p>
    </Card>
  )
}
