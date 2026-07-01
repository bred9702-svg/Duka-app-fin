import SectionCard from './SectionCard'

export default function HighestProfitCard({
  highestProfit,
  compact = false,
}) {
  return (
    <SectionCard
      title="💰 Highest Profit"
      height={compact ? 190 : 260}
    >
      {highestProfit ? (
        <>
          <h2
            style={{
              margin: 0,
              color: 'var(--text-hi)',
              fontSize: compact ? 18 : 24,
            }}
          >
            {highestProfit.name}
          </h2>

          <p
            style={{
              marginTop: 12,
              color: '#5FD97A',
              fontWeight: 700,
              fontSize: compact ? 14 : 16,
            }}
          >
            KES {Math.round(highestProfit.profit).toLocaleString()}
          </p>

          <div
            style={{
              marginTop: 18,
            }}
          >
            <small
              style={{
                color: 'var(--text-low)',
              }}
            >
              Category
            </small>

            <p
              style={{
                margin: '6px 0 0',
                fontWeight: 600,
              }}
            >
              {highestProfit.category}
            </p>
          </div>
        </>
      ) : (
        <p>No profit data available.</p>
      )}
    </SectionCard>
  )
}
