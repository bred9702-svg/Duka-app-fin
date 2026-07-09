import Icon from '../ui/Icon'
import { fmtKES } from '../../utils/formatters'

/**
 * LowStockSection — real inventory data only. Lists products at or
 * below their configured restock threshold (stock_alert), using each
 * product's actual current stock and prices.
 */
export default function LowStockSection({ lowStock = [] }) {
  if (lowStock.length === 0) return null

  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
        color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em',
        margin: '10px 0 8px',
      }}>
        Low Stock ({lowStock.length})
      </p>

      {lowStock.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 11px', marginBottom: 6, borderRadius: 12,
            background: 'rgba(240,169,61,0.06)',
            border: '1px solid rgba(240,169,61,0.18)',
            animation: 'slideUp .35s ease-out backwards',
            animationDelay: `${i * 0.04}s`,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: 'rgba(240,169,61,.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="package" size={13} color="#F0A93D" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text-hi)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {p.name}
            </p>
            <p style={{ fontSize: 8, color: 'var(--text-low)', marginTop: 2 }}>
              Threshold: {p.stock_alert ?? 5} · {fmtKES(p.cost_price || 0)} KES / unit to restock
            </p>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0A93D' }}>
              {p.stock_current ?? 0}
            </p>
            <p style={{ fontSize: 8, color: 'var(--text-low)' }}>left</p>
          </div>
        </div>
      ))}
    </div>
  )
}
