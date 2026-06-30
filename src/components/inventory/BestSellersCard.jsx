import Card from '../ui/Card'

export default function BestSellersCard({
  bestSeller,
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
        Best Seller
      </p>

      {bestSeller ? (
        <>
          <h2
            style={{
              margin: 0,
              color: 'var(--text-hi)',
            }}
          >
            {bestSeller.name}
          </h2>

          <p
            style={{
              marginTop: 8,
              color: '#5FD97A',
              fontWeight: 700,
            }}
          >
            🔥 {bestSeller.sold} units sold
          </p>

          <p
            style={{
              marginTop: 8,
              color: 'var(--text-low)',
              fontSize: 12,
            }}
          >
            Category: {bestSeller.category}
          </p>
        </>
      ) : (
        <p>No sales data available.</p>
      )}
    </Card>
  )
}
