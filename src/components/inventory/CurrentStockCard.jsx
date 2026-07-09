import { fmtKES } from '../../utils/formatters'
import { PRODUCT_CATEGORY_LABELS } from '../../data/mockData'

/**
 * CurrentStockCard — real inventory data only (no mocks). Shows total
 * inventory value (stock × purchase price) and the remaining quantity
 * for every product currently in the catalog.
 */
export default function CurrentStockCard({ products = [] }) {
  const totalValue = products.reduce(
    (a, p) => a + (p.stock_current || 0) * (p.cost_price || 0), 0
  )

  const sorted = [...products].sort(
    (a, b) => (b.stock_current || 0) - (a.stock_current || 0)
  )

  function stockColor(p) {
    const stock = p.stock_current || 0
    if (stock === 0) return '#FF6B5B'
    if (stock <= (p.stock_alert || 5)) return '#F0A93D'
    return '#5FD97A'
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
        color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em',
        margin: '10px 0 8px',
      }}>
        Current Stock
      </p>

      <div
        style={{
          background: 'var(--card-elevated-bg)',
          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid var(--card-elevated-border)',
          borderRadius: 14, padding: '12px 14px', marginBottom: 8,
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>
          Total Inventory Value
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F0A93D' }}>
          {fmtKES(totalValue)} KES
        </p>
        <p style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 3 }}>
          {products.length} product{products.length !== 1 ? 's' : ''} · based on current stock × purchase price
        </p>
      </div>

      {products.length === 0 ? (
        <div
          style={{
            padding: '16px', borderRadius: 12, textAlign: 'center',
            background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--text-low)' }}>No products in your catalog yet</p>
        </div>
      ) : (
        sorted.map((p, i) => {
          const value = (p.stock_current || 0) * (p.cost_price || 0)
          return (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 11px', marginBottom: 6, borderRadius: 12,
                background: 'var(--glass-fill-soft)',
                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid var(--glass-border)',
                animation: 'slideUp .35s ease-out backwards',
                animationDelay: `${Math.min(i, 20) * 0.03}s`,
              }}
            >
              <div style={{ width: 3, height: 32, borderRadius: 999, background: stockColor(p), flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 12, fontWeight: 600, letterSpacing: '-.01em', color: 'var(--text-hi)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {p.name}
                </p>
                <p style={{ fontSize: 8, opacity: 0.65, color: 'var(--text-low)', marginTop: 2 }}>
                  {PRODUCT_CATEGORY_LABELS[p.category] || p.category || 'Uncategorized'} · {fmtKES(value)} KES value
                </p>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: stockColor(p) }}>
                  {p.stock_current ?? 0}
                </p>
                <p style={{ fontSize: 8, color: 'var(--text-low)' }}>in stock</p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
