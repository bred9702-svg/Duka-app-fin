import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import ScreenContainer from '../components/layout/ScreenContainer'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'
import TransactionRow from '../components/transactions/TransactionRow'

const LIST_LIMIT = 8

export default function TransactionsScreen() {
  const navigate = useNavigate()
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const addTransaction = useAppStore((s) => s.addTransaction)
  const session = useAppStore((s) => s.session)

  const [showAllUnclassified, setShowAllUnclassified] = useState(false)
  const [showAllClassified, setShowAllClassified] = useState(false)
  const [showAllIgnored, setShowAllIgnored] = useState(false)

  const unclassified = transactions.filter((t) => !t.classified)
  const ignored = transactions.filter((t) => t.classified && t.operation_type === 'ignored')
  const classified = transactions.filter((t) => t.classified && t.operation_type !== 'ignored')

  const visibleUnclassified = showAllUnclassified ? unclassified : unclassified.slice(0, LIST_LIMIT)
  const visibleClassified = showAllClassified ? classified : classified.slice(0, LIST_LIMIT)
  const visibleIgnored = showAllIgnored ? ignored : ignored.slice(0, LIST_LIMIT)

  async function addCash(direction) {
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

    await addTransaction({
      amount,
      source: 'cash',
      direction,
      classified: false,
      mpesa_sender_name: null,
      mpesa_sender_phone: null,
      mpesa_reference: null,
    })
  }

  return (
    <ScreenContainer>
      <div
        className="bg-blob"
        style={{
          width: 130,
          height: 130,
          top: -30,
          right: -30,
          background: 'rgba(240,169,61,0.2)',
        }}
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
            <Icon name="plus" size={15} />
            Cash in
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
            <Icon name="minus" size={15} />
            Cash out
          </button>
        </div>

        {unclassified.length === 0 ? (
          <Card
            style={{
              textAlign: 'center',
              padding: 24,
              marginBottom: 12,
            }}
          >
            <Icon
              name="circleCheck"
              size={32}
              color="#5FD97A"
              style={{
                display: 'block',
                margin: '0 auto 8px',
              }}
            />

            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-hi)',
                marginBottom: 4,
              }}
            >
              All clear
            </p>

            <p
              style={{
                fontSize: 12,
                color: 'var(--text-low)',
              }}
            >
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

            {visibleUnclassified.map((t, i) => (
              <TransactionRow
                key={t.id}
                txn={t}
                customers={customers}
                delay={i * 0.05}
                onClick={() => navigate(`/classify/${t.id}`)}
              />
            ))}

            {unclassified.length > LIST_LIMIT && (
              <div
                onClick={() => setShowAllUnclassified((v) => !v)}
                style={{
                  textAlign: 'center', padding: '8px 0 2px', fontSize: 11, fontWeight: 600,
                  color: '#FF6B5B', cursor: 'pointer',
                }}
              >
                {showAllUnclassified ? 'Show Less' : `Show More (${unclassified.length - LIST_LIMIT})`}
              </div>
            )}
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

            {visibleClassified.map((t, i) => (
              <TransactionRow
                key={t.id}
                txn={t}
                customers={customers}
                delay={i * 0.03}
              />
            ))}

            {classified.length > LIST_LIMIT && (
              <div
                onClick={() => setShowAllClassified((v) => !v)}
                style={{
                  textAlign: 'center', padding: '8px 0 2px', fontSize: 11, fontWeight: 600,
                  color: '#5FD97A', cursor: 'pointer',
                }}
              >
                {showAllClassified ? 'Show Less' : `Show More (${classified.length - LIST_LIMIT})`}
              </div>
            )}
          </div>
        )}

        {session?.role === 'owner' && ignored.length > 0 && (
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
              Ignored duplicates
            </p>

            {visibleIgnored.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                txn={transaction}
                customers={customers}
                delay={index * 0.03}
                onClick={() => navigate(`/classify/${transaction.id}`)}
              />
            ))}

            {ignored.length > LIST_LIMIT && (
              <div
                onClick={() => setShowAllIgnored((value) => !value)}
                style={{
                  textAlign: 'center', padding: '8px 0 2px', fontSize: 11, fontWeight: 600,
                  color: '#94A3B8', cursor: 'pointer',
                }}
              >
                {showAllIgnored ? 'Show Less' : `Show More (${ignored.length - LIST_LIMIT})`}
              </div>
            )}
          </div>
        )}
      </div>
    </ScreenContainer>
  )
}
