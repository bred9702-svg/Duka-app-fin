import SectionCard from './SectionCard'
import CardHeader from '../ui/CardHeader'
import CardBody from '../ui/CardBody'

export default function DeadStockCard({
  deadStock = [],
  compact = false,
}) {
  const count = deadStock.length

  return (
    <SectionCard
      height={compact ? 76 : 110}
    >
      <CardHeader
        title="Dead Stock"
        badge={
          count === 0
            ? 'GOOD'
            : 'ACTION'
        }
        badgeVariant={
          count === 0
            ? 'ok'
            : 'warn'
        }
      />

      <CardBody
        icon="😴"
        value={count}
        subtitle={
          count === 1
            ? 'Inactive product'
            : 'Inactive products'
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
