import SectionCard from './SectionCard'
import Badge from '../ui/Badge'

export default function HighestProfitCard({
  highestProfit,
  compact = false,
}) {
  return (
    <SectionCard
      title="Highest Profit"
      height={compact ? 94 : 150}
    >
      {!highestProfit ? (
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-low)',
            margin: '8px 0 0',
          }}
        >
          No data available
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 16,
              }}
            >
              💰
            </div>

            <Badge variant="warn">
              TOP
            </Badge>
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-hi)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {highestProfit.name}
          </h3>

          <p
            style={{
              margin: '6px 0 2px',
              fontSize: 16,
              fontWeight: 700,
              color: '#F0A93D',
              lineHeight: 1,
            }}
          >
            {Math.round(highestProfit.profit).toLocaleString()}
          </p>

          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: 'var(--text-low)',
            }}
          >
            KES profit
          </p>
        </>
      )}
    </SectionCard>
  )
}
