import Card from '../ui/Card'

export default function InventorySummaryCard({
  totalProducts,
  lowStock,
  outOfStock,
}) {
  const healthy =
    totalProducts - lowStock.length - outOfStock.length

  return (
    <Card style={{ marginBottom: 16 }}>
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-low)',
          marginBottom: 12,
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
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Products</span>
          <strong>{totalProducts}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Healthy Products</span>
          <strong>{healthy}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Low Stock</span>
          <strong>{lowStock.length}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Out of Stock</span>
          <strong>{outOfStock.length}</strong>
        </div>
      </div>
    </Card>
  )
}
