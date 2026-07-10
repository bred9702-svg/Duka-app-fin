import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'
import { fmtKES } from '../utils/formatters'
import FadeIn from '../components/animation/FadeIn'
import StaggerContainer from '../components/animation/StaggerContainer'
import AnimatedCounter from '../components/animation/AnimatedCounter'
import CreateProductSheet from '../components/inventory/CreateProductSheet'

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

function TrialBlockedMessage({ message }) {
  return (
    <div style={{
      background: 'rgba(255,107,91,0.10)',
      border: '1px solid rgba(255,107,91,0.3)',
      borderRadius: 12,
      padding: '10px 12px',
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <Icon name="alertTriangle" size={15} color="#FF6B5B" />
      <p style={{ fontSize: 11, color: '#FF6B5B', margin: 0 }}>
        {message}
      </p>
    </div>
  )
}

export default function NewSaleScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const paymentAmount = location.state?.paymentAmount ?? null
  const linkedTransactionId = location.state?.linkedTransactionId ?? null

  const products = useAppStore((s) => s.products)
  const customers = useAppStore((s) => s.customers)
  const addCustomer = useAppStore((s) => s.addCustomer)
  const completeSale = useAppStore((s) => s.completeSale)
  const writeBlocked = useAppStore((s) => s.writeBlocked)
  const trialEndedMessage = useAppStore((s) => s.trialEndedMessage)
  const session = useAppStore((s) => s.session)
  const isEmployee = session?.role === 'employee'

  const [customerQuery, setCustomerQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [query, setQuery] = useState('')
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [productCreatedNote, setProductCreatedNote] = useState(null)
  const [cart, setCart] = useState([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!linkedTransactionId) {
      navigate('/inbox', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => navigate('/inbox'), 2200)
    return () => clearTimeout(t)
  }, [result, navigate])

  const customerMatches = useMemo(() => {
    const q = customerQuery.trim().toLowerCase()
    if (!q) return customers.slice(0, 5)
    return customers
      .filter((c) => [c.name, c.phone, c.mpesa_name].filter(Boolean).some((value) => value.toLowerCase().includes(q)))
      .slice(0, 5)
  }, [customers, customerQuery])

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const inCartIds = new Set(cart.map((c) => c.productId))
    return products
      .filter((p) => (p.stock_current || 0) > 0 && !inCartIds.has(p.id) && p.name.toLowerCase().includes(q))
      .slice(0, 5)
  }, [query, products, cart])

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
  const difference = paymentAmount !== null ? paymentAmount - grandTotal : null

  const hasCustomer = !!selectedCustomer || (addingCustomer && newCustomerName.trim())
  const canSave = cart.length > 0 && hasCustomer && !saving && !writeBlocked

  async function handleConfirm() {
    if (writeBlocked) {
      setError(trialEndedMessage)
      return
    }

    if (!canSave) return

    setError(null)
    setSaving(true)

    try {
      const items = cart.map((it) => ({
        productId: it.productId,
        name: it.name,
        unitPrice: it.unitPrice,
        costPrice: it.costPrice,
        quantity: it.quantity,
      }))

      let customerId = selectedCustomer?.id || null

      if (!customerId && addingCustomer && newCustomerName.trim()) {
        const customer = await addCustomer({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || null,
        })
        if (!customer?.id) throw new Error('Could not create customer.')
        customerId = customer.id
        setSelectedCustomer(customer)
      }

      const summary = await completeSale({ linkedTransactionId, items, customerId })
      setResult(summary)
    } catch (err) {
      console.error('Confirm sale failed:', err)
      setError(
        err?.message || 'Could not save this sale. Check your connection and try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!linkedTransactionId) {
    return null
  }

  if (result) {
    return (
      <div style={{ flex: 1, width: '100%', padding: '16px 14px 100px', position: 'relative' }}>
        <div className="bg-blob" style={{ width: 200, height: 200, top: -40, right: -40, background: 'rgba(240,169,61,0.16)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SubScreenHeader title="Sale Complete" />

          <FadeIn>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(95,217,122,.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '8px auto 14px',
            }}>
              <Icon name="circleCheck" size={26} color="#5FD97A" />
            </div>
            <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 18 }}>
              Sale recorded successfully
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

              <div style={{ display: 'grid', gridTemplateColumns: isEmployee ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Items</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>
                    {result.itemCount} product{result.itemCount > 1 ? 's' : ''} · {result.totalQuantity} units
                  </p>
                </div>
                {!isEmployee && (
                  <div>
                    <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Profit</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#5FD97A' }}>
                      <AnimatedCounter value={result.totalProfit} format={fmtKES} suffix=" KES" />
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={140}>
            <button
              onClick={() => navigate('/inbox')}
              style={{
                width: '100%', marginTop: 12, padding: '13px', borderRadius: 12,
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)',
                fontSize: 13, fontWeight: 700, color: '#0F1117', background: '#F0A93D',
              }}
            >
              Back to Inbox
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

        {writeBlocked && (
          <TrialBlockedMessage message={trialEndedMessage} />
        )}

        {paymentAmount !== null && (
          <GlassCard style={{
            background: 'linear-gradient(160deg, rgba(95,217,122,0.10), rgba(255,255,255,0.02))',
            border: '1px solid rgba(95,217,122,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Payment Received</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#5FD97A' }}>
                {fmtKES(paymentAmount)} KES
              </p>
            </div>
            <Icon name="circleCheck" size={20} color="#5FD97A" />
          </GlassCard>
        )}

        <SectionTitle>Customer</SectionTitle>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            borderRadius: 12, background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
          }}>
            <Icon name="search" size={15} color="var(--text-low)" />
            <input
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Search customer..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-hi)', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {customerMatches.map((customer) => {
          const selected = selectedCustomer?.id === customer.id
          return (
            <div
              key={customer.id}
              onClick={() => {
                setSelectedCustomer(customer)
                setCustomerQuery(customer.name)
                setAddingCustomer(false)
              }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', marginBottom: 8, borderRadius: 12, cursor: 'pointer',
                background: selected ? 'rgba(95,217,122,.14)' : 'var(--glass-fill-soft)',
                border: selected ? '1px solid rgba(95,217,122,.55)' : '1px solid var(--glass-border)',
              }}
            >
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{customer.name}</p>
                {customer.phone && <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{customer.phone}</p>}
              </div>
              {selected && <Icon name="circleCheck" size={18} color="#5FD97A" />}
            </div>
          )
        })}

        <button
          onClick={() => {
            if (writeBlocked) {
              setError(trialEndedMessage)
              return
            }
            setAddingCustomer((open) => !open)
            setSelectedCustomer(null)
          }}
          style={{
            width: '100%', marginBottom: addingCustomer ? 8 : 16, padding: '10px 12px',
            borderRadius: 12, border: '1px dashed var(--text-low)', background: 'transparent',
            color: 'var(--text-low)', fontSize: 12, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <Icon name="plus" size={14} /> + New Customer
        </button>

        {addingCustomer && (
          <GlassCard style={{ marginBottom: 16 }}>
            <input
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="Name"
              style={inputStyle}
            />
            <input
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              placeholder="Phone"
              style={{ ...inputStyle, marginTop: 8 }}
            />
            <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 8 }}>
              This customer will be saved automatically when you confirm the sale.
            </p>
          </GlassCard>
        )}

        <div style={{ position: 'relative', marginBottom: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            borderRadius: 12, background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
          }}>
            <Icon name="search" size={15} color="var(--text-low)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products sold..."
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

          {query.trim() && suggestions.length === 0 && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 20,
              background: 'var(--card-elevated-bg)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid var(--card-elevated-border)', borderRadius: 12, overflow: 'hidden',
              boxShadow: 'var(--card-shadow)',
            }}>
              <div
                onClick={() => {
                  if (writeBlocked) {
                    setError(trialEndedMessage)
                    return
                  }
                  setShowCreateProduct(true)
                }}
                style={{ padding: '11px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Icon name="plus" size={13} color="#F0A93D" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F0A93D' }}>
                  Create New Product "{query.trim()}"
                </span>
              </div>
            </div>
          )}
        </div>

        {productCreatedNote && (
          <div style={{
            background: 'rgba(240,169,61,0.08)', border: '1px solid rgba(240,169,61,0.2)',
            borderRadius: 10, padding: '9px 11px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="circleCheck" size={13} color="#F0A93D" />
            <p style={{ fontSize: 10, color: '#F0A93D', margin: 0 }}>
              "{productCreatedNote}" added to your catalog — record a purchase to give it stock before selling it.
            </p>
          </div>
        )}

        {showCreateProduct && (
          <CreateProductSheet
            initialName={query.trim()}
            onClose={() => setShowCreateProduct(false)}
            onCreated={(product) => {
              setShowCreateProduct(false)
              setQuery('')
              setProductCreatedNote(product.name)
            }}
          />
        )}

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
              Search and add products to build this sale
            </p>
          </GlassCard>
        )}

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

              {difference !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: difference === 0 ? '#5FD97A' : difference > 0 ? '#F0A93D' : '#FF6B5B' }}>
                    {difference === 0 ? 'Matches Payment' : difference > 0 ? 'Under Payment' : 'Over Payment'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: difference === 0 ? '#5FD97A' : difference > 0 ? '#F0A93D' : '#FF6B5B' }}>
                    {fmtKES(Math.abs(difference))} KES
                  </span>
                </div>
              )}
            </GlassCard>
          </>
        )}

        {error && (
          <div style={{
            background: 'rgba(255,107,91,0.10)', border: '1px solid rgba(255,107,91,0.3)',
            borderRadius: 12, padding: '10px 12px', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="alertTriangle" size={15} color="#FF6B5B" />
            <p style={{ fontSize: 11, color: '#FF6B5B', margin: 0 }}>{error}</p>
          </div>
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

const inputStyle = {
  width: '100%',
  border: '1px solid var(--glass-border)',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13,
  background: 'var(--glass-fill-soft)',
  color: 'var(--text-hi)',
  outline: 'none',
}
