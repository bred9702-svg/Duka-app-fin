import Card from '../ui/Card'

export default function HighestProfitCard({
  highestProfit,
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
        Highest Profit
      </p>

      {highestProfit ? (
        <>
          <h2
            style={{
              margin: 0,
              color: 'var(--text-hi)',
            }}
          >
            {highestProfit.name}
          </h2>

          <p
            style={{
              marginTop: 8,
              color: '#5FD97A',
              fontWeight: 700,
            }}
          >
            💰 KES {Math.round(highestProfit.profit).toLocaleString()}
          </p>

          <p
            style={{
              marginTop: 8,
              color: 'var(--text-low)',
              fontSize: 12,
            }}
          >
            Category: {highestProfit.category}
          </p>
        </>
      ) : (
        <p>No profit data available.</p>
      )}
    </Card>
  )
}
