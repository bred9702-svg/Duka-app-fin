import SectionCard from './SectionCard'
import Badge from '../ui/Badge'

export default function BestSellersCard({
  bestSeller,
  compact = false,
}) {
  return (
    <SectionCard
      title="Best Seller"
      height={compact ? 94 : 150}
    >
      {!bestSeller ? (
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-low)',
            margin: '8px 0 0',
          }}
        >
          No sales yet
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
              🔥
            </div>

            <Badge variant="ok">
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
            {bestSeller.name}
          </h3>

          <p
            style={{
              margin: '6px 0 2px',
              fontSize: 16,
              fontWeight: 700,
              color: '#5FD97A',
              lineHeight: 1,
            }}
          >
            {bestSeller.sold}
          </p>

          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: 'var(--text-low)',
            }}
          >
            units sold
          </p>
        </>
      )}
    </SectionCard>
  )
}
