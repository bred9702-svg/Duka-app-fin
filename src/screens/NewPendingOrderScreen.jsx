import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import FadeIn from '../components/animation/FadeIn'
import StaggerContainer from '../components/animation/StaggerContainer'
import Avatar from '../components/ui/Avatar'
import { fmtKES } from '../utils/formatters'

export default function NewPendingOrderScreen() {
  const navigate = useNavigate()
  const products = useAppStore((s) => s.products)
  const customers = useAppStore((s) => s.customers)
  const create = useAppStore((s) => s.createPendingOrder)
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [customerId, setCustomerId] = useState(null)
  const [showCustomers, setShowCustomers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const selectedCustomer = customers.find((c) => c.id === customerId)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return products.filter((p) => (p.stock_current - (p.reserved_stock || 0)) > 0 && !cart.some((i) => i.productId === p.id) && p.name.toLowerCase().includes(q)).slice(0, 8)
  }, [query, products, cart])
  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0)

  function add(product) {
    const available = product.stock_current - (product.reserved_stock || 0)
    setCart((items) => [...items, { productId: product.id, name: product.name, unitPrice: product.unit_price, quantity: 1, available }])
    setQuery('')
  }
  function changeQty(id, delta) { setCart((items) => items.map((item) => item.productId === id ? { ...item, quantity: Math.max(1, Math.min(item.available, item.quantity + delta)) } : item)) }
  async function save() {
    setSaving(true); setError(null)
    try {
      const order = await create({ items: cart.map(({ productId, quantity }) => ({ productId, quantity })), customerId })
      navigate(`/orders/${order.id}`, { replace: true })
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 34px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 180, height: 180, top: -60, right: -60, background: 'rgba(240,169,61,.16)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="New Order" />
        <FadeIn duration={280} y={10}>
          <div style={introCard}>
            <div style={introIcon}><Icon name="receiptOff" size={19} color="#F0A93D" /></div>
            <div><p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>Start a customer order</p><p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>Products are reserved until payment, debt or cancellation.</p></div>
          </div>
        </FadeIn>

        <SectionLabel>Customer</SectionLabel>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowCustomers(!showCustomers)} style={{ ...selectionCard, borderColor: showCustomers ? 'rgba(240,169,61,.4)' : 'var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {selectedCustomer ? <Avatar name={selectedCustomer.name} color="blue" size={34} /> : <div style={walkInIcon}><Icon name="users" size={16} color="#F0A93D" /></div>}
              <div style={{ textAlign: 'left' }}><p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>{selectedCustomer?.name || 'Walk-in customer'}</p><p style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{selectedCustomer ? selectedCustomer.phone || 'Saved customer' : 'Customer details are not required'}</p></div>
            </div>
            <Icon name="chevronRight" size={15} color="var(--text-low)" style={{ transform: showCustomers ? 'rotate(90deg)' : 'rotate(0)' }} />
          </button>
          {showCustomers && <div style={dropdown}>
            <button onClick={() => { setCustomerId(null); setShowCustomers(false) }} style={customerRow}><div style={walkInIcon}><Icon name="users" size={14} color="#F0A93D" /></div><span>Walk-in customer</span>{!customerId && <Icon name="circleCheck" size={15} color="#5FD97A" />}</button>
            {customers.slice(0, 8).map((customer) => <button key={customer.id} onClick={() => { setCustomerId(customer.id); setShowCustomers(false) }} style={customerRow}><Avatar name={customer.name} color="blue" size={30} /><span style={{ flex: 1, textAlign: 'left' }}>{customer.name}</span>{customerId === customer.id && <Icon name="circleCheck" size={15} color="#5FD97A" />}</button>)}
          </div>}
        </div>

        <SectionLabel>Products</SectionLabel>
        <div style={{ position: 'relative' }}>
          <div style={searchBox}><Icon name="search" size={15} color="var(--text-low)" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your inventory..." style={searchInput} /></div>
          {query.trim() && <div style={productDropdown}>{matches.length ? matches.map((product) => <button key={product.id} onClick={() => add(product)} style={productRow}><div><p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hi)' }}>{product.name}</p><p style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{product.stock_current - (product.reserved_stock || 0)} available</p></div><div style={{ textAlign: 'right' }}><p style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#F0A93D', fontWeight: 700 }}>{fmtKES(product.unit_price)} KES</p><Icon name="plus" size={14} color="#F0A93D" style={{ marginLeft: 'auto', marginTop: 3 }} /></div></button>) : <p style={{ padding: 14, textAlign: 'center', fontSize: 10, color: 'var(--text-low)' }}>No available product found</p>}</div>}
        </div>

        {cart.length ? <StaggerContainer step={45}>
          <div style={{ marginTop: 12 }}>{cart.map((item) => <div key={item.productId} style={cartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}><div><p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>{item.name}</p><p style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{fmtKES(item.unitPrice)} KES per unit</p></div><button onClick={() => setCart((items) => items.filter((x) => x.productId !== item.productId))} style={removeButton}><Icon name="x" size={12} color="#FF6B5B" /></button></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 9, borderTop: '1px solid var(--glass-border)' }}><div style={qtyControl}><button onClick={() => changeQty(item.productId, -1)} disabled={item.quantity <= 1} style={qtyButton}><Icon name="minus" size={12} /></button><span style={{ minWidth: 24, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>{item.quantity}</span><button onClick={() => changeQty(item.productId, 1)} disabled={item.quantity >= item.available} style={qtyButton}><Icon name="plus" size={12} /></button></div><p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0A93D' }}>{fmtKES(item.unitPrice * item.quantity)} KES</p></div>
          </div>)}</div>
        </StaggerContainer> : <div style={emptyBasket}><Icon name="package" size={22} color="var(--text-low)" /><p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 8 }}>Search and add products to this order</p></div>}

        <div style={summaryCard}><div><p style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase' }}>{totalQty} unit{totalQty === 1 ? '' : 's'} reserved</p><p style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-hi)', fontWeight: 700, marginTop: 2 }}>Order total</p></div><p style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: '#F0A93D' }}>{fmtKES(total)} <span style={{ fontSize: 10 }}>KES</span></p></div>
        {error && <div style={errorBox}><Icon name="alertTriangle" size={14} color="#FF6B5B" /><p>{error}</p></div>}
        <button onClick={save} disabled={!cart.length || saving} style={{ ...saveButton, opacity: cart.length && !saving ? 1 : .38 }}>{saving ? 'Creating order...' : 'Create pending order'}</button>
      </div>
    </div>
  )
}

function SectionLabel({ children }) { return <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '.09em', margin: '15px 0 7px' }}>{children}</p> }
const introCard = { display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, background: 'linear-gradient(145deg,rgba(240,169,61,.10),rgba(255,255,255,.02))', border: '1px solid rgba(240,169,61,.18)' }
const introIcon = { width: 38, height: 38, borderRadius: 12, background: 'rgba(240,169,61,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const selectionCard = { width: '100%', padding: 11, borderRadius: 13, border: '1px solid', background: 'linear-gradient(150deg,rgba(255,255,255,.045),rgba(255,255,255,.015))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }
const walkInIcon = { width: 34, height: 34, borderRadius: 11, background: 'rgba(240,169,61,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const dropdown = { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 30, padding: 6, borderRadius: 13, background: 'var(--card-elevated-bg)', border: '1px solid var(--card-elevated-border)', boxShadow: 'var(--card-shadow)', maxHeight: 260, overflowY: 'auto' }
const customerRow = { width: '100%', padding: 8, border: 0, borderBottom: '1px solid var(--glass-border)', background: 'transparent', display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-hi)', fontSize: 11, cursor: 'pointer' }
const searchBox = { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 13, background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)' }
const searchInput = { flex: 1, border: 0, outline: 0, background: 'transparent', color: 'var(--text-hi)', fontSize: 12, fontFamily: 'inherit' }
const productDropdown = { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 25, borderRadius: 13, overflow: 'hidden', background: 'var(--card-elevated-bg)', border: '1px solid var(--card-elevated-border)', boxShadow: 'var(--card-shadow)' }
const productRow = { width: '100%', padding: '10px 12px', border: 0, borderBottom: '1px solid var(--glass-border)', background: 'transparent', display: 'flex', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer' }
const cartCard = { padding: 12, marginBottom: 8, borderRadius: 14, border: '1px solid var(--glass-border)', background: 'linear-gradient(150deg,rgba(255,255,255,.045),rgba(255,255,255,.015))', boxShadow: '0 8px 20px rgba(0,0,0,.10)' }
const removeButton = { width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(255,107,91,.2)', background: 'rgba(255,107,91,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const qtyControl = { display: 'flex', alignItems: 'center', gap: 5, padding: 3, borderRadius: 10, background: 'rgba(255,255,255,.025)', border: '1px solid var(--glass-border)' }
const qtyButton = { width: 26, height: 26, border: 0, borderRadius: 7, background: 'var(--faint-fill)', color: 'var(--text-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const emptyBasket = { padding: 28, marginTop: 12, textAlign: 'center', borderRadius: 14, border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,.015)' }
const summaryCard = { padding: 13, marginTop: 12, borderRadius: 15, border: '1px solid rgba(240,169,61,.22)', background: 'linear-gradient(145deg,rgba(240,169,61,.11),rgba(255,255,255,.02))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const errorBox = { display: 'flex', alignItems: 'center', gap: 7, marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(255,107,91,.09)', border: '1px solid rgba(255,107,91,.25)', color: '#FF6B5B', fontSize: 10 }
const saveButton = { width: '100%', padding: 13, marginTop: 11, border: '1px solid rgba(255,255,255,.35)', borderRadius: 12, background: 'linear-gradient(135deg,#FFC56B,#F0A93D)', color: '#211506', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, boxShadow: '0 10px 25px -10px rgba(240,169,61,.7)' }
