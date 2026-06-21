import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'
import TransactionRow from '../components/transactions/TransactionRow'
import { newId } from '../utils/formatters'

export default function TransactionsScreen() {
  const navigate = useNavigate()
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const addTransaction = useAppStore((s) => s.addTransaction)

  const unclassified = transactions.filter((t) => !t.classified)
  const classified = transactions.filter((t) => t.classified)

  function addCash(direction) {
    const raw = window.prompt(
      (direction === 'in' ? 'Cash received' : 'Cash paid out') +
        ' — enter amount in KES:'
    )
    if (!raw) return
    const amount = parseInt(raw.replace(/[^0-9]/g, ''), 10)
    if (!amount || amount <= 0) {
      window.alert('Invalid amount')
      return
    }
    addTransaction({
      id: newId('t'),
      amount,
      source: 'cash',
      direction,
      ts: Date.now(),
      classified: false,
      classification: null,
    })
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 130, height: 130, top: -30, right: -30, background: 'rgba(240,169,61,0.2)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 21,
              fontWeight: 700,
              color: 'var(--text-hi)',
              letterSpacing: '-0.02em',
            }}
          >
            Inbox
          </h1>
          {unclassified.length > 0 && (
            <span
              style={{
                background: 'rgba(255,107,91,0.18)',
                color: '#FF6B5B',
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 10,
              }}
            >
              {unclassified.length} to classify
            </span>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <button
            onClick={() => addCash('in')}
            style={{
              background: 'rgba(95,217,122,0.14)',
              color: '#5FD97A',
              border: '1px solid rgba(95,217,122,0.35)',
              borderRadius: 11,
              padding: '10px 8px',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Icon name="plus" size={15} /> Cash in
          </button>
          <button
            onClick={() => addCash('out')}
            style={{
              background: 'rgba(255,107,91,0.14)',
              color: '#FF6B5B',
              border: '1px solid rgba(255,107,91,0.35)',
              borderRadius: 11,
              padding: '10px 8px',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Icon name="minus" size={15} /> Cash out
          </button>
        </div>

        {unclassified.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 24, marginBottom: 12 }}>
            <Icon
              name="circleCheck"
              size={32}
              color="#5FD97A"
              style={{ display: 'block', margin: '0 auto 8px' }}
            />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 4 }}>
              All clear
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-low)' }}>
              No transactions to classify
            </p>
          </Card>
        ) : (
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
              Needs classification
            </p>
            {unclassified.map((t, i) => (
              <TransactionRow
                key={t.id}
                txn={t}
                customers={customers}
                delay={i * 0.05}
                onClick={() => navigate(`/classify/${t.id}`)}
              />
            ))}
          </div>
        )}

        {classified.length > 0 && (
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-low)',
                margin: '12px 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Classified
            </p>
            {classified.map((t, i) => (
              <TransactionRow key={t.id} txn={t} customers={customers} delay={i * 0.03} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
