import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import BackButton from '../components/ui/BackButton'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import { fmtKES, fmtTime, newId } from '../utils/formatters'
import { EXPENSE_CATEGORIES } from '../data/mockData'

const TYPE_OPTS = [
  { id: 'sale', icon: 'bottle', label: 'Sale', color: '#F0A93D' },
  { id: 'debt', icon: 'userDollar', label: 'Debt', color: '#5B9FF0' },
  { id: 'expense', icon: 'receiptOff', label: 'Expense', color: '#FF6B5B' },
]

export default function ClassifyScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const classifyTransaction = useAppStore((s) => s.classifyTransaction)
  const addCustomer = useAppStore((s) => s.addCustomer)
  const addDebtPayment = useAppStore((s) => s.addDebtPayment)
  const increaseDebt = useAppStore((s) => s.increaseDebt)

  const txn = transactions.find((t) => t.id === id)

  const [type, setType] = useState(null)
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [category, setCategory] = useState(null)
  const [customerId, setCustomerId] = useState(null)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [done, setDone] = useState(false)

  if (!txn) {
    return (
      <div style={{ flex: 1, padding: 24 }}>
        <BackButton to="/inbox" />
        <p style={{ color: 'var(--text-hi)' }}>Transaction not found.</p>
      </div>
    )
  }

  const canConfirm =
    type &&
    ((type === 'sale' && product.trim()) ||
      (type === 'expense' && category) ||
      (type === 'debt' && (customerId || newName.trim())))

  function confirm() {
    let cls = {
      type,
      productName: product || null,
      quantity: qty || null,
      category: category || null,
      customerId: customerId || null,
    }

    if (type === 'debt' && addingNew && newName.trim()) {
      const newCust = {
        id: newId('c'),
        name: newName.trim(),
        phone: newPhone.trim(),
        totalOwed: txn.direction === 'out' ? txn.amount : 0,
        payments: [],
      }
      addCustomer(newCust)
      cls.customerId = newCust.id
    } else if (type === 'debt' && customerId) {
      if (txn.direction === 'in') {
        addDebtPayment(customerId, txn.amount, txn.id)
      } else {
        increaseDebt(customerId, txn.amount)
      }
    }

    classifyTransaction(txn.id, cls)
    setDone(true)
    setTimeout(() => navigate('/inbox'), 700)
  }

  if (done) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(95,217,122,0.18)',
            border: '1px solid rgba(95,217,122,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            animation: 'popIn 0.4s ease-out',
          }}
        >
          <Icon name="check" size={32} color="#5FD97A" />
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-hi)' }}>
          Classified!
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-low)', marginTop: 4 }}>
          Transaction saved
        </p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 130, height: 130, top: 40, right: -40, background: 'rgba(240,169,61,0.2)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <BackButton to="/inbox" />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 19,
            fontWeight: 700,
            color: 'var(--text-hi)',
            letterSpacing: '-0.02em',
            marginBottom: 14,
          }}
        >
          Classify
        </h1>

        <div
          className="glass-card"
          style={{ textAlign: 'center', padding: 16, marginBottom: 16, position: 'relative', overflow: 'hidden' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              color: '#FFD98A',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            {(txn.source === 'mpesa' ? 'M-Pesa' : 'Cash') + ' · ' + fmtTime(txn.ts)}
          </p>
          <p
            className="shimmer-text"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: '5px 0',
            }}
          >
            {(txn.direction === 'in' ? '+' : '-') + fmtKES(txn.amount)}
          </p>
          <p style={{ fontSize: 9, color: 'var(--text-low)' }}>KES</p>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            color: 'var(--text-low)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
        >
          What is this?
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {TYPE_OPTS.map((o) => {
            const selected = type === o.id
            return (
              <div
                key={o.id}
                onClick={() => {
                  setType(o.id)
                  setCategory(null)
                  setCustomerId(null)
                  setAddingNew(false)
                }}
                style={{
                  background: selected ? `${o.color}26` : 'var(--glass-fill-soft)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: selected ? `1.5px solid ${o.color}99` : '1px solid var(--glass-border)',
                  boxShadow: selected ? `0 4px 16px -4px ${o.color}55` : 'none',
                  borderRadius: 12,
                  padding: '12px 6px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <Icon
                  name={o.icon}
                  size={20}
                  color={selected ? o.color : 'var(--text-mid)'}
                  style={{ display: 'block', margin: '0 auto 5px' }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: selected ? o.color : 'var(--text-mid)',
                  }}
                >
                  {o.label}
                </span>
              </div>
            )
          })}
        </div>

        {type === 'sale' && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 6 }}>
              Product name
            </p>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Johnnie Walker Black"
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: 'var(--text-low)', margin: '10px 0 6px' }}>
              Quantity (optional)
            </p>
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 2 bottles"
              style={inputStyle}
            />
          </div>
        )}

        {type === 'expense' && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 8 }}>
              Category
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EXPENSE_CATEGORIES.map((c) => {
                const selected = category === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    style={{
                      background: selected ? 'rgba(91,159,240,0.18)' : 'var(--glass-fill-soft)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: selected ? '1.5px solid rgba(91,159,240,0.7)' : '1px solid var(--glass-border)',
                      borderRadius: 11,
                      padding: 10,
                      textAlign: 'center',
                      cursor: 'pointer',
                      gridColumn: c.id === 'other' ? '1 / -1' : 'auto',
                    }}
                  >
                    <Icon
                      name={c.icon}
                      size={18}
                      color={selected ? '#5B9FF0' : 'var(--text-mid)'}
                      style={{ display: 'block', margin: '0 auto 3px' }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: selected ? '#5B9FF0' : 'var(--text-hi)',
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      {c.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {type === 'debt' && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 8 }}>
              {txn.direction === 'in' ? 'Customer repaying debt' : 'Assign debt to customer'}
            </p>
            {customers.map((c) => {
              const selected = customerId === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setCustomerId(c.id)
                    setAddingNew(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    background: selected ? 'rgba(91,159,240,0.16)' : 'var(--glass-fill-soft)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: selected ? '1.5px solid rgba(91,159,240,0.7)' : '1px solid var(--glass-border)',
                    borderRadius: 11,
                    marginBottom: 8,
                    cursor: 'pointer',
                  }}
                >
                  <Avatar name={c.name} color="blue" size={32} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)' }}>{c.name}</p>
                    <p style={{ fontSize: 10, color: '#FFD98A' }}>
                      {fmtKES(c.totalOwed)} KES owed
                    </p>
                  </div>
                  {selected && <Icon name="circleCheck" size={18} color="#5B9FF0" />}
                </div>
              )
            })}
            <div
              onClick={() => {
                setAddingNew(!addingNew)
                setCustomerId(null)
              }}
              style={{
                border: '1px dashed var(--text-low)',
                borderRadius: 11,
                padding: 10,
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--text-low)',
                cursor: 'pointer',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Icon name="plus" size={14} /> New customer
            </div>
            {addingNew && (
              <div>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Customer name"
                  style={{ ...inputStyle, marginBottom: 8 }}
                />
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Button
            variant={type === 'sale' ? 'primary' : type === 'expense' ? 'danger' : 'amber'}
            onClick={confirm}
            disabled={!canConfirm}
            icon="check"
          >
            {type ? `Confirm ${type}` : 'Select a type'}
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
