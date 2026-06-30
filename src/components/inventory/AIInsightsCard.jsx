import Card from '../ui/Card'

export default function AIInsightsCard({
  bestSeller,
  highestProfit,
  lowStock,
  outOfStock,
}) {
  return (
    <Card style={{ marginBottom: 16 }}>
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
        AI Insights
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        <p style={{ margin: 0 }}>
          🔥 <strong>Best Seller:</strong>{' '}
          {bestSeller
            ? `${bestSeller.name} (${bestSeller.sold} sold)`
            : 'No sales yet'}
        </p>

        <p style={{ margin: 0 }}>
          💰 <strong>Highest Profit:</strong>{' '}
          {highestProfit
            ? `${highestProfit.name} (KES ${Math.round(highestProfit.profit)})`
            : 'No data'}
        </p>

        <p style={{ margin: 0 }}>
          ⚠ <strong>Low Stock:</strong>{' '}
          {lowStock.length} product(s)
        </p>

        <p style={{ margin: 0 }}>
          📦 <strong>Out of Stock:</strong>{' '}
          {outOfStock.length} product(s)
        </p>
      </div>
    </Card>
  )
}
