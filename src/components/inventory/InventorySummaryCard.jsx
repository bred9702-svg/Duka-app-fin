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
        padding: 12,
        background: 'rgba(255,255,255,.02)',
        border: '1px solid rgba(255,255,255,.10)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: 'none',
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
        background:
          'linear-gradient(180deg, rgba(28,28,28,.65) 0%, rgba(18,18,18,.72) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 10,
        padding: '10px 12px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,.06), 0 8px 20px -6px rgba(0,0,0,.45)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--text-low)',
          opacity: 0.85,
          lineHeight: 1,
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: '8px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.015em',
          color,
          lineHeight: 1.15,
        }}
      >
        {value}
      </p>
    </div>
  )
}
