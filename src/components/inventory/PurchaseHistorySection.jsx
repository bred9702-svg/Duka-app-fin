import { useState, useEffect } from 'react'
import { fmtKES } from '../../utils/formatters'
import { getStockPurchases } from '../../lib/db'

function fmtPurchaseDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function PurchaseHistorySection() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getStockPurchases()
      .then((records) => {
        if (active) setHistory(records)
      })
      .catch((loadError) => {
        console.error('Load purchase history failed:', loadError)
        if (active) setError('Could not load purchase history.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  if (loading) {
    return <p style={{ margin: '10px 0', fontSize: 10, color: 'var(--text-low)' }}>Loading purchase history...</p>
  }
  if (error) {
    return <p style={{ margin: '10px 0', fontSize: 10, color: '#FF6B5B' }}>{error}</p>
  }
  if (history.length === 0) return null

  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
        color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em',
        margin: '10px 0 8px',
      }}>
        Purchase History ({history.length})
      </p>

      {history.map((record) => {
        const expectedRevenue = Number(record.expected_revenue) || 0
        const expectedProfit = Number(record.expected_profit) || 0
        const margin = expectedRevenue > 0
          ? Math.round((expectedProfit / expectedRevenue) * 100)
          : 0
        const productSummary = (record.items || [])
          .map((item) => `${item.product?.name || 'Product'} ×${item.quantity}`)
          .join(', ')

        return (
          <div
            key={record.id}
            style={{
              background: 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 14, padding: '12px 14px', marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>
                  {fmtPurchaseDate(record.purchase_date || record.created_at)}
                </p>
                {record.supplier && (
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{record.supplier}</p>
                )}
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0A93D' }}>
                {fmtKES(record.total_investment)} KES
              </p>
            </div>

            <p style={{
              fontSize: 10, color: 'var(--text-mid)', lineHeight: 1.4, marginBottom: 8,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {productSummary}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
              <div>
                <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>Expected Revenue</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--text-hi)' }}>
                  {fmtKES(expectedRevenue)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>Expected Profit</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: '#5FD97A' }}>
                  {fmtKES(expectedProfit)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>Margin</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: '#F0A93D' }}>
                  {margin}%
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
