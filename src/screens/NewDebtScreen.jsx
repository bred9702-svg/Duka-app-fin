import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'
import { fmtKES } from '../utils/formatters'
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

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
      borderRadius: 12, background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
    }}>
      <Icon name="search" size={15} color="var(--text-low)" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-hi)', fontFamily: 'inherit' }}
      />
    </div>
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
    }}>
      <p style={{ fontSize: 11, color: '#FF6B5B', margin: 0 }}>
        {message}
      </p>
    </div>
  )
}

export default function NewDebtScreen() {
  const navigate = useNavigate()
  const customers = useAppStore((s) => s.customers)
  const products = useAppStore((s) => s.products)
  const addCustomer = useAppStore((s) => s.addCustomer)
  const createDebtSale = useAppStore((s) => s.createDebtSale)
  const writeBlocked = useAppStore((s) => s.writeBlocked)
  const trialEndedMessage = useAppStore((s) => s.trialEndedMessage)

  const [customerQuery, setCustomerQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [cart, setCart] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const customerMatches = useMemo(() => {
    const q = customerQuery.trim().toLowerCase()
    if (!q) return customers.slice(0, 5)
    return customers
      .filter((c) => [c.name, c.phone, c.mpesa_name].filter(Boolean).some((v) => v.toLowerCase().includes(q)))
      .slice(0, 5)
  }, [customers, customerQuery])

  const productMatches = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) return []
    const inCart = new Set(cart.map((item) => item.productId))
    return products
      .filter((p) => (p.stock_current || 0) > 0 && !inCart.has(p.id) && p.name.toLowerCase().includes(q))
      .slice(0, 5)
  }, [products, productQuery, cart])

  const grandTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)
  const canConfirm = !!selectedCustomer && cart.length > 0 && !saving && !writeBlocked

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
    setProductQuery('')
  }

  function changeQty(productId, delta) {
    setCart((prev) => prev.map((item) => {
      if (item.productId !== productId) return item
      return { ...item, quantity: Math.max(1, Math.min(item.stock, item.quantity + delta)) }
    }))
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  async function createCustomer() {
    if (writeBlocked) {
      setError(trialEndedMessage)
      return
    }

    if (!newCustomerName.trim()) return

    setError(null)

    try {
      const customer = await addCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || null,
      })
      if (!customer?.id) throw new Error('Could not create customer.')
      setSelectedCustomer(customer)
      setCustomerQuery(customer.name)
      setAddingCustomer(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
    } catch (err) {
      setError(err?.message || 'Could not create customer. Try again.')
    }
  }

  async function confirmDebt() {
    if (writeBlocked) {
      setError(trialEndedMessage)
      return
    }

    if (!canConfirm) return

    setSaving(true)
    setError(null)

    try {
      await createDebtSale({
        customerId: selectedCustomer.id,
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          quantity: item.quantity,
        })),
      })
      navigate('/debts')
    } catch (err) {
      setError(err?.message || 'Could not save this debt. Try again.')
      setSaving(false)
    }
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 100px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 200, height: 200, top: -40, right: -40, background: 'rgba(91,159,240,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="New Debt" />

        {writeBlocked && (
          <TrialBlockedMessage message={trialEndedMessage} />
        )}

        <p style={sectionTitleStyle}>Customer</p>
        <SearchBox value={customerQuery} onChange={setCustomerQuery} placeholder="Search customer..." />

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
                padding: '10px 12px', marginTop: 8, borderRadius: 12, cursor: 'pointer',
                background: selected ? 'rgba(91,159,240,.16)' : 'var(--glass-fill-soft)',
                border: selected ? '1px solid rgba(91,159,240,.65)' : '1px solid var(--glass-border)',
              }}
            >
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{customer.name}</p>
                <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{fmtKES(customer.total_owed || 0)} KES owed</p>
              </div>
              {selected && <Icon name="circleCheck" size={18} color="#5B9FF0" />}
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
          }}
          style={ghostButtonStyle}
        >
          <Icon name="plus" size={14} /> + New Customer
        </button>

        {addingCustomer && (
          <GlassCard>
            <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Customer name" style={inputStyle} />
            <input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Phone (optional)" style={{ ...inputStyle, marginTop: 8 }} />
            <button onClick={createCustomer} disabled={!newCustomerName.trim() || writeBlocked} style={{ ...primaryButtonStyle, marginTop: 10, opacity: newCustomerName.trim() && !writeBlocked ? 1 : 0.45 }}>
              Save Customer
            </button>
          </GlassCard>
        )}

        <p style={sectionTitleStyle}>Products</p>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <SearchBox value={productQuery} onChange={setProductQuery} placeholder="Search products..." />
          {productMatches.length > 0 && (
            <div style={dropdownStyle}>
              {productMatches.map((product) => (
                <div key={product.id} onClick={() => addToCart(product)} style={dropdownRowStyle}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)' }}>{product.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{fmtKES(product.unit_price)} KES · Stock: {product.stock_current}</span>
                </div>
              ))}
            </div>
          )}
          {productQuery.trim() && productMatches.length === 0 && (
            <div style={dropdownStyle}>
              <div
                onClick={() => {
                  if (writeBlocked) {
                    setError(trialEndedMessage)
                    return
                  }
                  setShowCreateProduct(true)
                }}
                style={{ ...dropdownRowStyle, justifyContent: 'flex-start', gap: 8 }}
              >
                <Icon name="plus" size={13} color="#F0A93D" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F0A93D' }}>Create Product "{productQuery.trim()}"</span>
              </div>
            </div>
          )}
        </div>

        {showCreateProduct && (
          <CreateProductSheet
            initialName={productQuery.trim()}
            onClose={() => setShowCreateProduct(false)}
            onCreated={() => {
              setShowCreateProduct(false)
              setProductQuery('')
            }}
          />
        )}

        {cart.length > 0 ? cart.map((item) => (
          <GlassCard key={item.productId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>{item.name}</p>
              <button onClick={() => removeFromCart(item.productId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                <Icon name="trash" size={14} color="#FF6B5B" />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{fmtKES(item.unitPrice)} KES / unit</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => changeQty(item.productId, -1)} disabled={item.quantity <= 1} style={qtyButtonStyle}>
                  <Icon name="minus" size={12} color="var(--text-hi)" />
                </button>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => changeQty(item.productId, 1)} disabled={item.quantity >= item.stock} style={qtyButtonStyle}>
                  <Icon name="plus" size={12} color="var(--text-hi)" />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 10, color: 'var(--text-low)' }}>{item.stock} in stock</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#F0A93D' }}>{fmtKES(item.unitPrice * item.quantity)} KES</span>
            </div>
          </GlassCard>
        )) : (
          <GlassCard style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--text-low)' }}>Search and add products for this debt.</p>
          </GlassCard>
        )}

        <GlassCard style={{ background: 'linear-gradient(160deg, rgba(91,159,240,0.10), rgba(255,255,255,0.02))', border: '1px solid rgba(91,159,240,0.20)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>Quantity</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{totalQuantity}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>Debt Total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#5B9FF0' }}>{fmtKES(grandTotal)} KES</span>
          </div>
        </GlassCard>

        {error && (
          <div style={{ background: 'rgba(255,107,91,0.10)', border: '1px solid rgba(255,107,91,0.3)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: '#FF6B5B', margin: 0 }}>{error}</p>
          </div>
        )}

        <button onClick={confirmDebt} disabled={!canConfirm} style={{ ...primaryButtonStyle, opacity: canConfirm ? 1 : 0.4 }}>
          {saving ? 'Saving...' : 'Confirm Debt'}
        </button>
      </div>
    </div>
  )
}

const sectionTitleStyle = {
  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
  color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em',
  margin: '18px 0 8px',
}

const inputStyle = {
  width: '100%', border: '1px solid var(--glass-border)', borderRadius: 10,
  padding: '10px 12px', fontSize: 13, background: 'var(--glass-fill-soft)',
  color: 'var(--text-hi)', outline: 'none',
}

const ghostButtonStyle = {
  width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 12,
  border: '1px dashed var(--text-low)', background: 'transparent', color: 'var(--text-low)',
  fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
}

const primaryButtonStyle = {
  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
  cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13,
  fontWeight: 700, color: '#0F1117', background: '#F0A93D',
}

const qtyButtonStyle = {
  width: 24, height: 24, borderRadius: 7, border: '1px solid var(--glass-border)',
  background: 'var(--faint-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}

const dropdownStyle = {
  position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 20,
  background: 'var(--card-elevated-bg)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid var(--card-elevated-border)', borderRadius: 12, overflow: 'hidden',
  boxShadow: 'var(--card-shadow)',
}

const dropdownRowStyle = {
  padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}
