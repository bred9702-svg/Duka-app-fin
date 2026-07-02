import SectionCard from './SectionCard'
import CardHeader from '../ui/CardHeader'
import CardBody from '../ui/CardBody'

export default function BestSellersCard({
  bestSeller,
  compact = false,
}) {
  if (!bestSeller) {
    return (
      <SectionCard height={compact ? 76 : 110}>
        <CardHeader
          title="Best Seller"
          badge="NEW"
          badgeVariant="gray"
        />

        <CardBody
          icon="🔥"
          value="No sales"
          subtitle="Waiting for transactions"
          valueColor="var(--text-hi)"
        />
      </SectionCard>
    )
  }

  return (
    <SectionCard
      height={compact ? 76 : 110}
    >
      <CardHeader
        title="Best Seller"
        badge="TOP"
        badgeVariant="ok"
      />

      <CardBody
        icon="🔥"
        value={bestSeller.name}
        subtitle={`${bestSeller.sold} sold`}
        valueColor="#5FD97A"
      />
    </SectionCard>
  )
}
