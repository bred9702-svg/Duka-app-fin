import Card from '../ui/Card'
import { fmtKES, fmtShortDate } from '../../utils/formatters'

export default function ActiveDebts({
  debts,
  onRecordPayment,
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-low)',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        Active Debts
      </p>

      {debts.length === 0 ? (
        <Card>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-low)',
              fontSize: 13,
            }}
          >
            No active debts
          </p>
        </Card>
      ) : (
        debts.map((debt) => (
          <Card
            key={debt.id}
            style={{
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    color: 'var(--text-hi)',
                    marginBottom: 4,
                  }}
                >
                  {debt.product?.name || 'Unknown product'}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-low)',
                  }}
                >
                  Qty {debt.quantity}
                </p>

                <p
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: 'var(--text-low)',
                  }}
                >
                  {fmtShortDate(debt.created_at || debt.ts)}
                </p>
              </div>

              <div
                style={{
                  textAlign: 'right',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#FF6B5B',
                  }}
                >
                  {fmtKES(debt.remaining_amount)}
                </p>

                <button
                  onClick={() => onRecordPayment(debt)}
                  style={{
                    marginTop: 8,
                    border: 0,
                    borderRadius: 8,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    background: '#F0A93D',
                    color: '#241400',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Record Payment
                </button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
