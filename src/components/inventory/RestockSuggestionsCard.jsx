import SectionCard from './SectionCard'
import CardHeader from '../ui/CardHeader'
import CardBody from '../ui/CardBody'

export default function RestockSuggestionsCard({
  suggestions = [],
  compact = false,
}) {
  const count = suggestions.length

  return (
    <SectionCard
      height={compact ? 76 : 110}
    >
      <CardHeader
        title="Restock"
        badge={
          count === 0
            ? 'READY'
            : 'RESTOCK'
        }
        badgeVariant={
          count === 0
            ? 'ok'
            : 'warn'
        }
      />

      <CardBody
        icon="📦"
        value={count}
        subtitle={
          count === 1
            ? 'Product needs restock'
            : 'Products need restock'
        }
        valueColor={
          count === 0
            ? '#5FD97A'
            : '#F0A93D'
        }
      />
    </SectionCard>
  )
}
