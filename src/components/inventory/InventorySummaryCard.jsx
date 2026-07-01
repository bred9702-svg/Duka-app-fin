import Card from '../ui/Card'

export default function InventorySummaryCard({
  totalProducts,
  lowStock,
  outOfStock,
}) {
  const healthy =
    totalProducts - lowStock.length - outOfStock.length

  return (
    <Card
      style={{
        marginBottom: 16,
        padding: 14,
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 12,
          fontSize: 10,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          fontWeight: 600,
        }}
      >
        Inventory Summary
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <Stat
          label="Products"
          value={totalProducts}
          color="var(--text-hi)"
        />

        <Stat
          label="Healthy"
          value={healthy}
          color="#5FD97A"
        />

        <Stat
          label="Low Stock"
          value={lowStock.length}
          color="#F0A93D"
        />

        <Stat
          label="Out of Stock"
          value={outOfStock.length}
          color="#FF6B5B"
        />
      </div>
    </Card>
  )
}

function Stat({
  label,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 10,
        padding: '10px 12px',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 9,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: '6px 0 0',
          fontSize: 20,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </p>
    </div>
  )
}
