import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'
import { fmtKES } from '../utils/formatters'
import FadeIn from '../components/animation/FadeIn'
import StaggerContainer from '../components/animation/StaggerContainer'
import AnimatedCounter from '../components/animation/AnimatedCounter'

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--glass-fill-soft)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid var(--glass-border)', borderRadius: 14,
      padding: '12px 14px', marginBottom: 8, ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
      color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em',
      margin: '18px 0 8px',
    }}>
      {children}
    </p>
  )
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function InventoryInvestmentScreen() {
  const navigate = useNavigate()
  const products = useAppStore((s) => s.products)
  const transactions = useAppStore((s) => s.transactions)
  const recordPurchase = useAppStore((s) => s.recordPurchase)

  const [supplier, setSupplier] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayISO())
  const [notes, setNotes] = useState('')

  const [query, setQuery] = useState('')
  const [items, setItems] = useState([]) // { productId, name, unitPrice, purchasePrice, quantity }

  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState(null)

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const addedIds = new Set(items.map((i) => i.productId))
    return products
      .filter((p) => !addedIds.has(p.id) && p.name.toLowerCase().includes(q))
      .slice(0, 5)
  }, [query, products, items])

  function addProduct(product) {
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        unitPrice: product.unit_price || 0,
        originalPrice: product.unit_price || 0,
        purchasePrice: product.cost_price || '',
        quantity: '',
      },
    ])
    setQuery('')
  }

  function updateItem(productId, field, value) {
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, [field]: value } : it))
    )
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((it) => it.productId !== productId))
  }

  const validItems = items.filter(
    (it) => Number(it.purchasePrice) > 0 && Number(it.quantity) > 0
  )

  const totalInvestment = validItems.reduce(
    (a, it) => a + Number(it.purchasePrice) * Number(it.quantity), 0
  )
  const expectedRevenue = validItems.reduce(
    (a, it) => a + Number(it.unitPrice) * Number(it.quantity), 0
  )
  const expectedProfit = expectedRevenue - totalInvestment
  const margin = expectedRevenue > 0 ? Math.round((expectedProfit / expectedRevenue) * 100) : 0

  const canSave = validItems.length > 0 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      const payloadItems = validItems.map((it) => ({
        productId: it.productId,
        name: it.name,
        unitPrice: Number(it.unitPrice),
        purchasePrice: Number(it.purchasePrice),
        quantity: Number(it.quantity),
        priceChanged: Number(it.unitPrice) !== Number(it.originalPrice),
      }))

      await recordPurchase({
        items: payloadItems,
        supplier: supplier.trim(),
        purchaseDate,
        notes: notes.trim(),
      })

      // Estimate how long this inventory should last based on historical sales velocity
      const now = Date.now()
      const days30 = 30 * 24 * 60 * 60 * 1000
      const sales = transactions.filter(
        (t) => t.operation_type === 'sale' && new Date(t.created_at || t.ts || now).getTime() >= now - days30
      )
      const soldQtyByProduct = {}
      sales.forEach((t) => {
        const pid = t.product_id || t.product?.id
        if (pid) soldQtyByProduct[pid] = (soldQtyByProduct[pid] || 0) + (t.quantity || 1)
      })

      let weeklyRate = 0
      payloadItems.forEach((it) => {
        const soldLast30d = soldQtyByProduct[it.productId] || 0
        weeklyRate += (soldLast30d / 30) * 7
      })
      const totalUnits = payloadItems.reduce((a, it) => a + it.quantity, 0)
      const weeksEstimate = weeklyRate > 0 ? Math.max(1, Math.round(totalUnits / weeklyRate)) : null

      setSummary({
        totalInvestment,
        expectedRevenue,
        expectedProfit,
        margin,
        weeksEstimate,
        productCount: payloadItems.length,
      })
    } catch (err) {
      console.error('Save purchase failed:', err)
    } finally {
      setSaving(false)
    }
  }

  if (summary) {
    return (
      <div style={{ flex: 1, width: '100%', padding: '16px 14px 100px', position: 'relative' }}>
        <div className="bg-blob" style={{ width: 200, height: 200, top: -40, right: -40, background: 'rgba(240,169,61,0.16)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SubScreenHeader title="Inventory Investment" />

          <FadeIn>
            <div
              style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(95,217,122,.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '8px auto 14px',
              }}
            >
              <Icon name="circleCheck" size={26} color="#5FD97A" />
            </div>

            <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 18 }}>
              Purchase recorded successfully
            </p>
          </FadeIn>

          <FadeIn delay={80}>
            <GlassCard style={{
              background: 'linear-gradient(160deg, rgba(240,169,61,0.10), rgba(255,255,255,0.03))',
              border: '1px solid rgba(240,169,61,0.20)',
            }}>
              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Investment</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F0A93D', marginBottom: 12 }}>
                <AnimatedCounter value={summary.totalInvestment} format={fmtKES} suffix=" KES" />
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Expected Revenue</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>
                    <AnimatedCounter value={summary.expectedRevenue} format={fmtKES} suffix=" KES" />
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Expected Profit</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#5FD97A' }}>
                    <AnimatedCounter value={summary.expectedProfit} format={fmtKES} suffix=" KES" />
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Estimated Margin</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#F0A93D' }}>
                  <AnimatedCounter value={summary.margin} suffix="%" />
                </p>
              </div>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={140}>
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(240,169,61,0.20)',
              borderRadius: 12, padding: '10px 12px', marginTop: 8,
            }}>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: 'var(--text-low)', marginBottom: 4 }}>
                DUKA AI
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5 }}>
                {summary.productCount} product{summary.productCount > 1 ? 's' : ''} added to inventory.{' '}
                {summary.weeksEstimate
                  ? `Based on your historical sales, this inventory should last approximately ${summary.weeksEstimate} week${summary.weeksEstimate > 1 ? 's' : ''}.`
                  : "Not enough sales history yet to estimate how long this inventory will last."}
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <button
              onClick={() => navigate('/inventory')}
              style={{
                width: '100%', marginTop: 18, padding: '13px', borderRadius: 12,
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)',
                fontSize: 13, fontWeight: 700, color: '#0F1117', background: '#F0A93D',
              }}
            >
              View Inventory
            </button>
          </FadeIn>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 100px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 200, height: 200, top: -40, right: -40, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Inventory Investment" />

        {/* Purchase details */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Supplier (optional)</p>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. KWAL Distributors"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: 'var(--text-hi)', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
            <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Purchase Date</p>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: 'var(--text-hi)', fontFamily: 'inherit', colorScheme: 'dark' }}
            />
          </div>
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
            <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Notes (optional)</p>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: 'var(--text-hi)', fontFamily: 'inherit' }}
            />
          </div>
        </GlassCard>

        {/* Add product */}
        <SectionTitle>Add Products</SectionTitle>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            borderRadius: 12, background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
          }}>
            <Icon name="search" size={15} color="var(--text-low)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products to add..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-hi)', fontFamily: 'inherit' }}
            />
          </div>

          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 20,
              background: 'var(--card-elevated-bg)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid var(--card-elevated-border)', borderRadius: 12, overflow: 'hidden',
              boxShadow: 'var(--card-shadow)',
            }}>
              {suggestions.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addProduct(p)}
                  style={{
                    padding: '10px 12px', cursor: 'pointer',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)' }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-low)' }}>Stock: {p.stock_current ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Line items */}
        {items.length > 0 && (
          <StaggerContainer step={40}>
            {items.map((item) => {
              const qty = Number(item.quantity) || 0
              const investment = (Number(item.purchasePrice) || 0) * qty
              const revenue = (Number(item.unitPrice) || 0) * qty
              const profit = revenue - investment
              return (
                <GlassCard key={item.productId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>{item.name}</p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <Icon name="trash" size={14} color="#FF6B5B" />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: 6 }}>
                    <div>
                      <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Purchase Price</p>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={item.purchasePrice}
                        onChange={(e) => updateItem(item.productId, 'purchasePrice', e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', background: 'var(--faint-fill)', border: '1px solid var(--faint-border)', borderRadius: 8, padding: '7px 8px', fontSize: 12, fontWeight: 600, color: '#F0A93D', fontFamily: 'var(--font-display)' }}
                      />
                    </div>
                    <div>
                      <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Selling Price</p>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.productId, 'unitPrice', e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', background: 'var(--faint-fill)', border: '1px solid var(--faint-border)', borderRadius: 8, padding: '7px 8px', fontSize: 12, fontWeight: 600, color: '#5FD97A', fontFamily: 'var(--font-display)' }}
                      />
                    </div>
                    <div>
                      <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Quantity</p>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.productId, 'quantity', e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', background: 'var(--faint-fill)', border: '1px solid var(--faint-border)', borderRadius: 8, padding: '7px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-hi)', fontFamily: 'var(--font-display)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: 6, marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
                    <div>
                      <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>Investment</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: '#F0A93D' }}>{fmtKES(investment)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>Revenue</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--text-hi)' }}>{fmtKES(revenue)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2 }}>Profit</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: '#5FD97A' }}>{fmtKES(profit)}</p>
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </StaggerContainer>
        )}

        {items.length === 0 && (
          <GlassCard style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--text-low)' }}>
              Search and add products above to build this purchase
            </p>
          </GlassCard>
        )}

        {/* Live summary */}
        {validItems.length > 0 && (
          <>
            <SectionTitle>Purchase Summary</SectionTitle>
            <GlassCard style={{
              background: 'linear-gradient(160deg, rgba(240,169,61,0.08), rgba(255,255,255,0.02))',
              border: '1px solid rgba(240,169,61,0.18)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Total Products</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{validItems.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Total Investment</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0A93D' }}>
                  <AnimatedCounter value={totalInvestment} format={fmtKES} suffix=" KES" duration={300} />
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Expected Revenue</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>
                  <AnimatedCounter value={expectedRevenue} format={fmtKES} suffix=" KES" duration={300} />
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Expected Gross Profit</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#5FD97A' }}>
                  <AnimatedCounter value={expectedProfit} format={fmtKES} suffix=" KES" duration={300} />
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Estimated Gross Margin</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0A93D' }}>
                  <AnimatedCounter value={margin} suffix="%" duration={300} />
                </span>
              </div>
            </GlassCard>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: '100%', marginTop: 8, padding: '13px', borderRadius: 12,
            border: 'none', cursor: canSave ? 'pointer' : 'default',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            color: '#0F1117', background: '#F0A93D',
            opacity: canSave ? 1 : 0.4, transition: 'opacity 200ms ease',
          }}
        >
          {saving ? 'Saving...' : 'Save Purchase'}
        </button>
      </div>
    </div>
  )
}
