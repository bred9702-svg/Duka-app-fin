import SectionCard from './SectionCard'

export default function DeadStockCard({
  deadStock = [],
  compact = false,
}) {
  const items = compact
    ? deadStock.slice(0, 3)
    : deadStock

  return (
    <SectionCard
      title="😴 Dead Stock"
      height={compact ? 190 : 260}
    >
      {items.length === 0 ? (
        <p
          style={{
            color: '#5FD97A',
            margin: 0,
            fontWeight: 600,
          }}
        >
          ✅ No dead stock
        </p>
      ) : (
        <>
          {items.map((product) => (
            <div
              key={product.id}
              style={{
                padding: '8px 0',
                borderBottom:
                  '1px solid rgba(255,255,255,.08)',
              }}
            >
              <strong>{product.name}</strong>

              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: 'var(--text-low)',
                }}
              >
                {product.stock_current} in stock
              </p>
            </div>
          ))}

          {compact &&
            deadStock.length > 3 && (
              <p
                style={{
                  marginTop: 12,
                  color: '#F0A93D',
                  fontWeight: 600,
                }}
              >
                +{deadStock.length - 3} more
              </p>
            )}
        </>
      )}
    </SectionCard>
  )
}
