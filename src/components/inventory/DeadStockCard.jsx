import SectionCard from './SectionCard'
import Badge from '../ui/Badge'

export default function DeadStockCard({
  deadStock = [],
  compact = false,
}) {
  const count = deadStock.length

  return (
    <SectionCard
      title="Dead Stock"
      height={compact ? 94 : 150}
    >
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
          😴
        </div>

        <Badge
          variant={count === 0 ? 'ok' : 'warn'}
        >
          {count === 0 ? 'GOOD' : 'ACTION'}
        </Badge>
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color:
            count === 0
              ? '#5FD97A'
              : '#F0A93D',
        }}
      >
        {count}
      </h3>

      <p
        style={{
          margin: '4px 0 0',
          fontSize: 10,
          color: 'var(--text-low)',
        }}
      >
        {count === 1
          ? 'product inactive'
          : 'products inactive'}
      </p>

      {count > 0 && (
        <p
          style={{
            marginTop: 10,
            fontSize: 10,
            color: '#F0A93D',
            fontWeight: 600,
          }}
        >
          View details →
        </p>
      )}
    </SectionCard>
  )
}
