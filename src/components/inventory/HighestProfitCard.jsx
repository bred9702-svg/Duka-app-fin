import SectionCard from './SectionCard'
import CardHeader from '../ui/CardHeader'
import CardBody from '../ui/CardBody'

export default function HighestProfitCard({
  highestProfit,
  compact = false,
}) {
  if (!highestProfit) {
    return (
      <SectionCard height={compact ? 94 : 150}>
        <CardHeader
          title="Highest Profit"
          badge="NEW"
          badgeVariant="gray"
        />

        <CardBody
          icon="💰"
          value="No data"
          subtitle="Waiting for sales"
          valueColor="var(--text-hi)"
        />
      </SectionCard>
    )
  }

  return (
    <SectionCard
      height={compact ? 94 : 150}
    >
      <CardHeader
        title="Highest Profit"
        badge="TOP"
        badgeVariant="warn"
      />

      <CardBody
        icon="💰"
        value={`KES ${Math.round(
          highestProfit.profit
        ).toLocaleString()}`}
        subtitle={highestProfit.name}
        valueColor="#F0A93D"
      />
    </SectionCard>
  )
}
