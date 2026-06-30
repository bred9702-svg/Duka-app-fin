import Card from '../ui/Card'

export default function DeadStockCard({
  deadStock = [],
}) {
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
        Dead Stock
      </p>

      {deadStock.length === 0 ? (
        <p
          style={{
            color: '#5FD97A',
            margin: 0,
            fontWeight: 600,
          }}
        >
          ✅ No dead stock detected.
        </p>
      ) : (
        deadStock.map(product => (
          <div
            key={product.id}
            style={{
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <strong>{product.name}</strong>

              <span
                style={{
                  color: '#FF5C5C',
                }}
              >
                {product.stock_current} left
              </span>
            </div>

            <p
              style={{
                marginTop: 6,
                color: 'var(--text-low)',
                fontSize: 12,
              }}
            >
              Category: {product.category}
            </p>
          </div>
        ))
      )}
    </Card>
  )
}
