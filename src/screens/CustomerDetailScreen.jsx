import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import BackButton from '../components/ui/BackButton'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import { fmtKES, fmtShortDate, newId } from '../utils/formatters'

export default function CustomerDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const customers = useAppStore((s) => s.customers)
  const addTransaction = useAppStore((s) => s.addTransaction)
  const addDebtPayment = useAppStore((s) => s.addDebtPayment)
  const [amount, setAmount] = useState('')

  const customer = customers.find((c) => c.id === id)

  if (!customer) {
    return (
      <div style={{ flex: 1, padding: 24 }}>
        <BackButton to="/debts" />
        <p style={{ color: 'var(--text-hi)' }}>Customer not found.</p>
      </div>
    )
  }

  function recordPayment() {
    const amt = parseInt(amount, 10)
    if (!amt || amt <= 0) return
    const txn = {
      id: newId('t'),
      amount: amt,
      source: 'cash',
      direction: 'in',
      ts: Date.now(),
      classified: true,
      classification: {
        type: 'debt',
        customerId: customer.id,
        productName: null,
        quantity: null,
        category: null,
      },
    }
    addTransaction(txn)
    addDebtPayment(customer.id, amt, txn.id)
    setAmount('')
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 120, height: 120, top: 20, right: -30, background: 'rgba(91,159,240,0.15)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <BackButton to="/debts" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar name={customer.name} color="blue" size={44} />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-hi)' }}>
              {customer.name}
            </p>
            {customer.phone && (
              <p style={{ fontSize: 12, color: 'var(--text-low)' }}>{customer.phone}</p>
            )}
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            marginBottom: 14,
            textAlign: 'center',
            padding: 16,
            borderColor: customer.totalOwed > 0 ? 'rgba(255,107,91,0.35)' : 'rgba(95,217,122,0.35)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 4 }}>
            Current balance
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: customer.totalOwed > 0 ? '#FF6B5B' : '#5FD97A',
            }}
          >
            {fmtKES(customer.totalOwed)}
          </p>
          {customer.totalOwed === 0 && (
            <p style={{ fontSize: 12, color: '#5FD97A', marginTop: 4, fontWeight: 500 }}>
              Fully paid
            </p>
          )}
        </div>

        {customer.totalOwed > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 8 }}>
              Record payment
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Amount (KES)"
                style={{
                  flex: 1,
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 13,
                  background: 'var(--glass-fill-soft)',
                  color: 'var(--text-hi)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              />
              <button
                onClick={recordPayment}
                disabled={!amount}
                style={{
                  background: 'linear-gradient(135deg, #FFC56B 0%, #F0A93D 100%)',
                  color: '#2A1A05',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: amount ? 1 : 0.5,
                  boxShadow: amount ? '0 6px 18px -6px rgba(240,169,61,0.5)' : 'none',
                }}
              >
                Record
              </button>
            </div>
          </div>
        )}

        {customer.payments.length > 0 ? (
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-low)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Payment history
            </p>
            {customer.payments.map((p, i) => (
              <Card
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--text-low)' }}>
                  {fmtShortDate(p.date)}
                </p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#5FD97A' }}>
                  +{fmtKES(p.amount)}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-low)',
              textAlign: 'center',
              padding: '16px 0',
            }}
          >
            No payments yet
          </p>
        )}
      </div>
    </div>
  )
}
