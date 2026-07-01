import SectionCard from './SectionCard'
import Badge from '../ui/Badge'

export default function HighestProfitCard({
  highestProfit,
  compact = false,
}) {
  return (
    <SectionCard
      title="Highest Profit"
      height={compact ? 185 : 250}
    >
      {!highestProfit ? (
        <p>No data available.</p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 42,
              }}
            >
              💰
            </div>

            <Badge variant="warn">
              PROFIT
            </Badge>
          </div>

          <h2
            style={{
              margin: '18px 0 8px',
              fontSize: compact ? 20 : 24,
            }}
          >
            {highestProfit.name}
          </h2>

          <div
            style={{
              fontSize: compact ? 26 : 34,
              fontWeight: 800,
              color: '#F0A93D',
              lineHeight: 1,
            }}
          >
            KES {Math.round(highestProfit.profit).toLocaleString()}
          </div>

          <p
            style={{
              marginTop: 8,
              color: 'var(--text-low)',
              fontSize: 12,
            }}
          >
            total profit
          </p>
        </>
      )}
    </SectionCard>
  )
}
