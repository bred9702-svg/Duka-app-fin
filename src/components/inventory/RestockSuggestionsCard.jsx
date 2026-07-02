import SectionCard from './SectionCard'
import Badge from '../ui/Badge'

export default function RestockSuggestionsCard({
  suggestions = [],
  compact = false,
}) {
  const count = suggestions.length

  return (
    <SectionCard
      title="Restock"
      height={compact ? 94 : 120}
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
            fontSize: 12,
          }}
        >
          📦
        </div>

        <Badge
          variant={count === 0 ? 'ok' : 'warn'}
        >
          {count === 0 ? 'READY' : 'RESTOCK'}
        </Badge>
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 600,
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
          fontSize: 9,
          color: 'var(--text-low)',
        }}
      >
        {count === 1
          ? 'product needs restock'
          : 'products need restock'}
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
