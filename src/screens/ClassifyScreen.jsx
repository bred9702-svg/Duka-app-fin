import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import BackButton from '../components/ui/BackButton'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import { fmtKES, fmtTime } from '../utils/formatters'
import { EXPENSE_CATEGORIES } from '../data/mockData'

const TYPE_OPTS = [
  { id: 'sale', icon: 'bottle', label: 'Sale', color: '#F0A93D' },
  { id: 'debt', icon: 'userDollar', label: 'Debt', color: '#5B9FF0' },
  { id: 'expense', icon: 'receiptOff', label: 'Expense', color: '#FF6B5B' },
]

const CATEGORIES = {
  beer: '🍺 Beer', whisky: '🥃 Whisky', gin: '🍸 Gin',
  vodka: '🍹 Vodka', cognac: '🥂 Cognac', wine: '🍷 Wine',
  liqueur: '🍶 Liqueur', rum: '🍾 Rum',
}

export default function ClassifyScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const products = useAppStore((s) => s.products)
  const classifyTransaction = useAppStore((s) => s.classifyTransaction)
  const addCustomer = useAppStore((s) => s.addCustomer)
  const addDebtPayment = useAppStore((s) => s.addDebtPayment)
  const increaseDebt = useAppStore((s) => s.increaseDebt)

  const txn = transactions.find((t) => t.id === id)

  const [type, setType] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [qty, setQty] = useState('1')
  const [category, setCategory] = useState(null)
  const [customerId, setCustomerId] = useState(null)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // FIX: dépendances correctes — on écoute `type`, `txn`, `products`
  useEffect(() => {
    if (type === 'sale' && txn && products.length > 0) {
      const match = products.find(
        (p) => Math.abs(p.unit_price - txn.amount) < p.unit_price * 0.15
      )
      if (match) {
        setSelectedProduct(match)
        setSearch(match.name)
      }
    }
  }, [type, txn, products])

  if (!txn) {
    return (
      <div style={{ flex: 1, padding: 24 }}>
        <BackButton to="/inbox" />
        <p style={{ color: 'var(--text-hi)' }}>Transaction not found.</p>
      </div>
    )
  }

  const parsedQty = Math.max(1, parseInt(qty) || 1) // FIX: qty "0" → 1, centralisé

  const canConfirm =
    type &&
    ((type === 'sale' && selectedProduct) ||
      (type === 'expense' && category) ||
      (type === 'debt' && (customerId || newName.trim())))

  async function confirm() {
    setSaving(true)
    try {
      const cls = {
        type,
        product_id: selectedProduct?.id || null,
        quantity: parsedQty,
        category: category || null,
        customer_id: customerId || null,
        unit_price: selectedProduct?.unit_price || null,
      }

      if (type === 'debt') {
        if (addingNew && newName.trim()) {
          // FIX: on vérifie que addCustomer a bien retourné un id avant de continuer
          const newCust = await addCustomer({
            name: newName.trim(),
            phone: newPhone.trim() || null,
          })
          if (!newCust?.id) throw new Error('Failed to create customer')
          cls.customer_id = newCust.id
        } else if (customerId) {
          if (txn.direction === 'in') {
            await addDebtPayment(customerId, txn.amount)
          } else {
            await increaseDebt(customerId, txn.amount)
          }
        }
      }

      await classifyTransaction(txn.id, cls)
      setDone(true)
      setTimeout(() => navigate('/inbox'), 700)
    } catch (err) {
      console.error('Classify error:', err)
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(95,217,122,0.18)',
          border: '1px solid rgba(95,217,122,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14, animation: 'popIn 0.4s ease-out',
        }}>
          <Icon name="check" size={32} color="#5FD97A" />
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-hi)' }}>Classified!</p>
        <p style={{ fontSize: 13, color: 'var(--text-low)', marginTop: 4 }}>Transaction saved</p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 130, height: 130, top: 40, right: -40, background: 'rgba(240,169,61,0.2)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <BackButton to="/inbox" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', marginBottom: 14 }}>
          Classify
        </h1>

        {/* Transaction card */}
        <div className="glass-card" style={{ textAlign: 'center', padding: 16, marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#FFD98A', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
            {(txn.source === 'mpesa' ? 'M-Pesa' : 'Cash') + ' · ' + fmtTime(txn.created_at || txn.ts)}
          </p>
          <p className="shimmer-text" style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: '5px 0' }}>
            {(txn.direction === 'in' ? '+' : '-') + fmtKES(txn.amount)}
          </p>
          {txn.mpesa_sender_name && (
            <p style={{ fontSize: 10, color: 'var(--text-low)' }}>
              {txn.mpesa_sender_name} · {txn.mpesa_sender_phone}
            </p>
          )}
        </div>

        {/* Type selector */}
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-low)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          What is this?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {TYPE_OPTS.map((o) => {
            const selected = type === o.id
            return (
              <div
                key={o.id}
                onClick={() => {
                  setType(o.id)
                  setCategory(null)
                  setCustomerId(null)
                  setSelectedProduct(null)
                  setSearch('')
                  setAddingNew(false)
                }}
                style={{
                  background: selected ? `${o.color}26` : 'var(--glass-fill-soft)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: selected ? `1.5px solid ${o.color}99` : '1px solid var(--glass-border)',
                  transform: selected ? 'translateY(-3px) scale(1.03)' : 'scale(1)',
                  transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
                  boxShadow: selected ? `0 14px 30px -10px ${o.color}55` : '0 3px 10px rgba(0,0,0,.08)',
                  borderRadius: 12,
                  padding: '12px 6px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <Icon
                  name={o.icon}
                  size={22}
                  color={selected ? o.color : 'var(--text-mid)'}
                  style={{
                    display: 'block',
                    margin: '0 auto 5px',
                    transform: selected ? 'scale(1.18)' : 'scale(1)',
                    transition: 'transform .25s cubic-bezier(.2,.8,.2,1)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: selected ? o.color : 'var(--text-mid)' }}>
                  {o.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* SALE */}
        {type === 'sale' && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 6 }}>
              Product
              {selectedProduct && (
                <span style={{ color: '#5FD97A', marginLeft: 6, fontWeight: 600 }}>✓ {selectedProduct.name}</span>
              )}
            </p>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedProduct(null) }}
                placeholder="Search product..."
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
              <Icon name="search" size={15} color="var(--text-low)" style={{ position: 'absolute', left: 11, top: 11 }} />
            </div>

            {search.length > 0 && !selectedProduct && (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 10, overflow: 'hidden',
                marginBottom: 10, maxHeight: 200, overflowY: 'auto',
              }}>
                {filteredProducts.length === 0
                  ? <p style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-low)' }}>No product found</p>
                  : filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedProduct(p); setSearch(p.name) }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        margin: '6px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        background: 'linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))',
                        border: '1px solid rgba(255,255,255,.05)',
                        transition: 'all .22s',
                        backdropFilter: 'blur(18px)',
                        WebkitBackdropFilter: 'blur(18px)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.border = '1px solid rgba(240,169,61,.35)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.border = '1px solid rgba(255,255,255,.05)'
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--text-hi)', fontWeight: 500 }}>{p.name}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-low)' }}>{CATEGORIES[p.category] || p.category} · Stock: {p.stock_current}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0A93D', marginBottom: 2 }}>
                          {fmtKES(p.unit_price)}
                        </p>
                        <p style={{ fontSize: 9, color: 'var(--text-low)' }}>per bottle</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* FIX: structure JSX correctement fermée */}
            {selectedProduct && (
              <div>
                <div style={{
                  background: 'rgba(240,169,61,0.1)',
                  border: '1px solid rgba(240,169,61,0.3)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 10,
                }}>
                  <p style={{ fontSize: 12, color: 'var(--text-hi)', fontWeight: 500, marginBottom: 2 }}>{selectedProduct.name}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 10 }}>
                    Stock: {selectedProduct.stock_current}
                    {selectedProduct.stock_current <= selectedProduct.stock_alert && (
                      <span style={{ color: '#FF6B5B', marginLeft: 6 }}>⚠ Low</span>
                    )}
                  </p>

                  {/* Qty controls */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <button
                      onClick={() => setQty((q) => String(Math.max(1, (parseInt(q) || 1) - 1)))}
                      style={qtyBtnStyle}
                    >
                      <Icon name="minus" size={16} color="var(--text-hi)" />
                    </button>
                    <input
                      value={qty}
                      onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ ...inputStyle, flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700, borderRadius: 12 }}
                    />
                    <button
                      onClick={() => setQty((q) => String((parseInt(q) || 1) + 1))}
                      style={qtyBtnStyle}
                    >
                      <Icon name="plus" size={16} color="var(--text-hi)" />
                    </button>
                  </div>

                  {/* Total */}
                  <div style={{
                    background: 'var(--glass-fill-soft)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 10, padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <p style={{ fontSize: 11, color: 'var(--text-low)' }}>Total</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#5FD97A' }}>
                      {fmtKES(selectedProduct.unit_price * parsedQty)} KES
                    </p>
                  </div>
                </div>{/* FIX: </div> du wrapper amber card */}
              </div>
            )}
          </div>
        )}

        {/* EXPENSE */}
        {type === 'expense' && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 8 }}>Category</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EXPENSE_CATEGORIES.map((c) => {
                const selected = category === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    style={{
                      background: selected ? 'rgba(91,159,240,0.18)' : 'var(--glass-fill-soft)',
                      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                      border: selected ? '1.5px solid rgba(91,159,240,0.7)' : '1px solid var(--glass-border)',
                      borderRadius: 11, padding: 10, textAlign: 'center', cursor: 'pointer',
                      gridColumn: c.id === 'other' ? '1 / -1' : 'auto',
                    }}
                  >
                    <Icon name={c.icon} size={18} color={selected ? '#5B9FF0' : 'var(--text-mid)'} style={{ display: 'block', margin: '0 auto 3px' }} />
                    <span style={{ fontSize: 11, color: selected ? '#5B9FF0' : 'var(--text-hi)', fontWeight: selected ? 600 : 400 }}>{c.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* DEBT */}
        {type === 'debt' && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 8 }}>
              {txn.direction === 'in' ? 'Customer repaying debt' : 'Assign debt to customer'}
            </p>

            {/* FIX: return() correctement fermé dans le .map() */}
            {customers.map((c) => {
              const selected = customerId === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => { setCustomerId(c.id); setAddingNew(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', marginBottom: 10, borderRadius: 14, cursor: 'pointer',
                    background: selected
                      ? 'rgba(91,159,240,.16)'
                      : 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02))',
                    border: selected ? '1.5px solid rgba(91,159,240,.65)' : '1px solid rgba(255,255,255,.06)',
                    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                    transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
                    transform: selected ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: selected ? '0 14px 30px rgba(91,159,240,.18)' : '0 4px 12px rgba(0,0,0,.10)',
                  }}
                >
                  <Avatar name={c.name} color="blue" size={36} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)' }}>{c.name}</p>
                    <p style={{ fontSize: 10, color: '#FFD98A', marginTop: 2, opacity: .85 }}>
                      {fmtKES(c.total_owed)} KES owed
                    </p>
                  </div>
                  {selected && (
                    <div style={{ animation: 'popIn .25s' }}>
                      <Icon name="circleCheck" size={18} color="#5B9FF0" />
                    </div>
                  )}
                </div>
              )
            })}

            <div
              onClick={() => { setAddingNew(!addingNew); setCustomerId(null) }}
              style={{
                border: '1px dashed var(--text-low)', borderRadius: 11, padding: 10,
                textAlign: 'center', fontSize: 12, color: 'var(--text-low)', cursor: 'pointer',
                marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <Icon name="plus" size={14} /> New customer
            </div>

            {addingNew && (
              <div>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Customer name" style={{ ...inputStyle, marginBottom: 8 }} />
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone (optional)" style={inputStyle} />
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Button
            variant={type === 'sale' ? 'primary' : type === 'expense' ? 'danger' : 'amber'}
            onClick={confirm}
            disabled={!canConfirm || saving}
            icon={saving ? 'loader' : 'check'}
          >
            {saving ? 'Saving...' : type ? `Confirm ${type}` : 'Select a type'}
          </Button>
        </div>
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
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
}

// FIX: style des boutons qty extrait pour éviter la duplication
const qtyBtnStyle = {
  width: 42, height: 42, borderRadius: 12,
  border: '1px solid rgba(255,255,255,.08)',
  background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))',
  backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'all .22s',
  boxShadow: '0 8px 18px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.08)',
}
