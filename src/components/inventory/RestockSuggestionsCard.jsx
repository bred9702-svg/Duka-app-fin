import Card from '../ui/Card'

export default function RestockSuggestionsCard({
  suggestions = [],
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
        Restock Suggestions
      </p>

      {suggestions.length === 0 ? (
        <p
          style={{
            margin: 0,
            color: '#5FD97A',
            fontWeight: 600,
          }}
        >
          ✅ No products need restocking.
        </p>
      ) : (
        suggestions.map(product => (
          <div
            key={product.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom:
                '1px solid rgba(255,255,255,.08)',
            }}
          >
            <div>
              <strong>{product.name}</strong>

              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: 'var(--text-low)',
                }}
              >
                Current: {product.stock_current}
              </p>
            </div>

            <div
              style={{
                textAlign: 'right',
              }}
            >
              <strong
                style={{
                  color: '#F0A93D',
                }}
              >
                +{product.recommended}
              </strong>

              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: 'var(--text-low)',
                }}
              >
                Order
              </p>
            </div>
          </div>
        ))
      )}
    </Card>
  )
}
