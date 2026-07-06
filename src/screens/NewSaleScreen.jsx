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

export default function NewSaleScreen() {
  const navigate = useNavigate()
  const products = useAppStore((s) => s.products)
  const customers = useAppStore((s) => s.customers)
  const recordSale = useAppStore((s) => s.recordSale)

  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([]) // { productId, name, unitPrice, costPrice, quantity, stock }

  const [type, setType] = useState('cash') // 'cash' | 'debt'
  const [customerQuery, setCustomerQuery] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const inCartIds = new Set(cart.map((c) => c.productId))
    return products
      .filter((p) => (p.stock_current || 0) > 0 && !inCartIds.has(p.id) && p.name.toLowerCase().includes(q))
      .slice(0, 5)
  }, [query, products, cart])

  const customerSuggestions = useMemo(() => {
    if (!customerQuery.trim()) return []
    const q = customerQuery.toLowerCase()
    return customers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5)
  }, [customerQuery, customers])

  function addToCart(product) {
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        unitPrice: product.unit_price || 0,
        costPrice: product.cost_price || 0,
        quantity: 1,
        stock: product.stock_current || 0,
      },
    ])
    setQuery('')
  }

  function changeQty(productId, delta) {
    setCart((prev) =>
      prev.map((it) => {
        if (it.productId !== productId) return it
        const next = Math.max(1, Math.min(it.stock, it.quantity + delta))
        return { ...it, quantity: next }
      })
    )
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((it) => it.productId !== productId))
  }

  const totalItems = cart.length
  const totalQuantity = cart.reduce((a, it) => a + it.quantity, 0)
  const grandTotal = cart.reduce((a, it) => a + it.unitPrice * it.quantity, 0)

  const canSave =
    cart.length > 0 &&
    !saving &&
    (type === 'cash' || customerId || (addingNew && newName.trim()))

  function selectCustomer(c) {
    setCustomerId(c.id)
    setCustomerQuery(c.name)
    setAddingNew(false)
  }

  async function handleConfirm() {
    if (!canSave) return
    setSaving(true)
    try {
      const items = cart.map((it) => ({
        productId: it.productId,
        name: it.name,
        unitPrice: it.unitPrice,
        costPrice: it.costPrice,
        quantity: it.quantity,
      }))

      const summary = await recordSale({
        items,
        type,
        customerId: type === 'debt' ? customerId : null,
        newCustomer: type === 'debt' && addingNew ? { name: newName.trim(), phone: newPhone.trim() } : null,
      })

      setResult(summary)
    } catch (err) {
      console.error('Confirm sale failed:', err)
    } finally {
      setSaving(false)
    }
  }

  if (result) {
    return (
      <div style={{ flex: 1, width: '100%', padding: '16px 14px 100px', position: 'relative' }}>
        <div className="bg-blob" style={{ width: 200, height: 200, top: -40, right: -40, background: 'rgba(240,169,61,0.16)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SubScreenHeader title="New Sale" />

          <FadeIn>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(95,217,122,.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '8px auto 14px',
            }}>
              <Icon name="circleCheck" size={26} color="#5FD97A" />
            </div>
            <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 18 }}>
              {type === 'debt' ? 'Debt sale recorded' : 'Sale recorded successfully'}
            </p>
          </FadeIn>

          <FadeIn delay={80}>
            <GlassCard style={{
              background: 'linear-gradient(160deg, rgba(240,169,61,0.10), rgba(255,255,255,0.03))',
              border: '1px solid rgba(240,169,61,0.20)',
            }}>
              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Grand Total</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#F0A93D', marginBottom: 12 }}>
                <AnimatedCounter value={result.grandTotal} format={fmtKES} suffix=" KES" />
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Items</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>
                    {result.itemCount} product{result.itemCount > 1 ? 's' : ''} · {result.totalQuantity} units
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Profit</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#5FD97A' }}>
                    <AnimatedCounter value={result.totalProfit} format={fmtKES} suffix=" KES" />
                  </p>
                </div>
              </div>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={140}>
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%', marginTop: 12, padding: '13px', borderRadius: 12,
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)',
                fontSize: 13, fontWeight: 700, color: '#0F1117', background: '#F0A93D',
              }}
            >
              Done
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
        <SubScreenHeader title="New Sale" />

        {/* Product search */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            borderRadius: 12, background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
          }}>
            <Icon name="search" size={15} color="var(--text-low)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products to sell..."
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
                  onClick={() => addToCart(p)}
                  style={{
                    padding: '10px 12px', cursor: 'pointer',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)' }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-low)' }}>
                    {fmtKES(p.unit_price)} KES · Stock: {p.stock_current}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        {cart.length > 0 ? (
          <StaggerContainer step={40}>
            {cart.map((item) => (
              <GlassCard key={item.productId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>{item.name}</p>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <Icon name="trash" size={14} color="#FF6B5B" />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-low)' }}>
                    {fmtKES(item.unitPrice)} KES / unit
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => changeQty(item.productId, -1)}
                      disabled={item.quantity <= 1}
                      style={{
                        width: 24, height: 24, borderRadius: 7, border: '1px solid var(--glass-border)',
                        background: 'var(--faint-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: item.quantity <= 1 ? 'default' : 'pointer', opacity: item.quantity <= 1 ? 0.4 : 1,
                      }}
                    >
                      <Icon name="minus" size={12} color="var(--text-hi)" />
                    </button>

                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', minWidth: 18, textAlign: 'center' }}>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => changeQty(item.productId, 1)}
                      disabled={item.quantity >= item.stock}
                      style={{
                        width: 24, height: 24, borderRadius: 7, border: '1px solid var(--glass-border)',
                        background: 'var(--faint-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: item.quantity >= item.stock ? 'default' : 'pointer', opacity: item.quantity >= item.stock ? 0.4 : 1,
                      }}
                    >
                      <Icon name="plus" size={12} color="var(--text-hi)" />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-low)' }}>
                    {item.quantity >= item.stock ? `Max stock (${item.stock})` : `${item.stock} in stock`}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#F0A93D' }}>
                    {fmtKES(item.unitPrice * item.quantity)} KES
                  </span>
                </div>
              </GlassCard>
            ))}
          </StaggerContainer>
        ) : (
          <GlassCard style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--text-low)' }}>
              Search and add products above to start a sale
            </p>
          </GlassCard>
        )}

        {/* Live summary */}
        {cart.length > 0 && (
          <>
            <SectionTitle>Sale Summary</SectionTitle>
            <GlassCard style={{
              background: 'linear-gradient(160deg, rgba(240,169,61,0.08), rgba(255,255,255,0.02))',
              border: '1px solid rgba(240,169,61,0.18)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Total Items</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{totalItems}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Total Quantity</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{totalQuantity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>Grand Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#F0A93D' }}>
                  <AnimatedCounter value={grandTotal} format={fmtKES} suffix=" KES" duration={300} />
                </span>
              </div>
            </GlassCard>
          </>
        )}

        {/* Transaction type */}
        {cart.length > 0 && (
          <>
            <SectionTitle>Transaction Type</SectionTitle>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {[
                { id: 'cash', label: 'Cash', icon: 'cash', color: '#5FD97A' },
                { id: 'debt', label: 'Debt', icon: 'userDollar', color: '#5B9FF0' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setType(opt.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '11px', borderRadius: 12, cursor: 'pointer',
                    background: type === opt.id ? `${opt.color}18` : 'var(--glass-fill-soft)',
                    border: type === opt.id ? `1.5px solid ${opt.color}60` : '1px solid var(--glass-border)',
                  }}
                >
                  <Icon name={opt.icon} size={15} color={type === opt.id ? opt.color : 'var(--text-low)'} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: type === opt.id ? opt.color : 'var(--text-low)' }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            {type === 'debt' && (
              <GlassCard>
                {!addingNew ? (
                  <>
                    <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 6, fontWeight: 500 }}>Customer</p>
                    <div style={{ position: 'relative' }}>
                      <input
                        value={customerQuery}
                        onChange={(e) => { setCustomerQuery(e.target.value); setCustomerId(null) }}
                        placeholder="Search customer..."
                        style={{ width: '100%', background: 'var(--faint-fill)', border: '1px solid var(--faint-border)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--text-hi)', fontFamily: 'inherit' }}
                      />
                      {customerSuggestions.length > 0 && !customerId && (
                        <div style={{
                          position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 20,
                          background: 'var(--card-elevated-bg)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                          border: '1px solid var(--card-elevated-border)', borderRadius: 10, overflow: 'hidden',
                          boxShadow: 'var(--card-shadow)',
                        }}>
                          {customerSuggestions.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => selectCustomer(c)}
                              style={{ padding: '9px 10px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', fontSize: 12, color: 'var(--text-hi)' }}
                            >
                              {c.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => { setAddingNew(true); setCustomerId(null); setCustomerQuery('') }}
                      style={{
                        marginTop: 8, background: 'transparent', border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, color: '#F0A93D', padding: 0,
                      }}
                    >
                      + Add new customer
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <p style={{ fontSize: 9, color: 'var(--text-low)', fontWeight: 500 }}>New Customer</p>
                      <button
                        onClick={() => setAddingNew(false)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--text-low)' }}
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Full name"
                      style={{ width: '100%', background: 'var(--faint-fill)', border: '1px solid var(--faint-border)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--text-hi)', fontFamily: 'inherit', marginBottom: 8 }}
                    />
                    <input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      style={{ width: '100%', background: 'var(--faint-fill)', border: '1px solid var(--faint-border)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--text-hi)', fontFamily: 'inherit' }}
                    />
                  </>
                )}
              </GlassCard>
            )}
          </>
        )}

        <button
          onClick={handleConfirm}
          disabled={!canSave}
          style={{
            width: '100%', marginTop: 8, padding: '13px', borderRadius: 12,
            border: 'none', cursor: canSave ? 'pointer' : 'default',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            color: '#0F1117', background: '#F0A93D',
            opacity: canSave ? 1 : 0.4, transition: 'opacity 200ms ease',
          }}
        >
          {saving ? 'Saving...' : 'Confirm Sale'}
        </button>
      </div>
    </div>
  )
}
