import { fmtKES } from '../../utils/formatters'

/**
 * ExpectedProfitCard — real inventory data only. Shows the profit the
 * merchant would realize if every unit currently in stock sold at its
 * existing selling price, using each product's actual cost_price and
 * unit_price (no mock numbers).
 */
export default function ExpectedProfitCard({ products = [] }) {
  const expectedRevenue = products.reduce(
    (a, p) => a + (p.stock_current || 0) * (p.unit_price || 0), 0
  )
  const expectedCost = products.reduce(
    (a, p) => a + (p.stock_current || 0) * (p.cost_price || 0), 0
  )
  const expectedProfit = expectedRevenue - expectedCost
  const margin = expectedRevenue > 0 ? Math.round((expectedProfit / expectedRevenue) * 100) : 0

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(95,217,122,0.10), rgba(255,255,255,0.02))',
        border: '1px solid rgba(95,217,122,0.20)',
        borderRadius: 14, padding: '12px 14px', marginBottom: 8,
      }}
    >
      <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>
        Expected Profit If All Stock Sold
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#5FD97A' }}>
        {fmtKES(expectedProfit)} KES
      </p>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
        <div>
          <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>Revenue</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>
            {fmtKES(expectedRevenue)} KES
          </p>
        </div>
        <div>
          <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>Cost</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>
            {fmtKES(expectedCost)} KES
          </p>
        </div>
        <div>
          <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>Margin</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#5FD97A' }}>
            {margin}%
          </p>
        </div>
      </div>
    </div>
  )
}
