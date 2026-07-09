import Card from '../ui/Card'
import { fmtKES } from '../../utils/formatters'
import {
  fmtDueStatus,
  fmtRelativeDay,
  getDebtOriginalAmount,
  getDebtPaidAmount,
  getDebtProgress,
  getDebtRemainingAmount,
} from '../../utils/debtInsights'

function DebtMetric({ label, value, color = 'var(--text-hi)' }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 8, color: 'var(--text-low)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </p>
    </div>
  )
}

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
        debts.map((debt) => {
          const original = getDebtOriginalAmount(debt)
          const paid = getDebtPaidAmount(debt)
          const remaining = getDebtRemainingAmount(debt)
          const progress = getDebtProgress(debt)
          const dueStatus = fmtDueStatus(debt)
          const createdLabel = fmtRelativeDay(debt.created_at || debt.ts, '')

          return (
            <Card
              key={debt.id}
              style={{
                marginBottom: 10,
                padding: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-hi)',
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {debt.product?.name || debt.product_name || debt.productName || debt.classification?.productName || 'Unknown product'}
                  </p>

                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--text-low)',
                    }}
                  >
                    Qty {debt.quantity || 1} · {dueStatus || createdLabel}
                  </p>
                </div>

                <button
                  onClick={() => onRecordPayment(debt)}
                  style={{
                    border: 0,
                    borderRadius: 8,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    background: '#F0A93D',
                    color: '#241400',
                    fontWeight: 700,
                    fontSize: 10,
                    flexShrink: 0,
                  }}
                >
                  Pay
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                <DebtMetric label="Original" value={fmtKES(original)} />
                <DebtMetric label="Paid" value={fmtKES(paid)} color="#5FD97A" />
                <DebtMetric label="Remaining" value={fmtKES(remaining)} color="#FF6B5B" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 7, borderRadius: 999, background: 'rgba(255,255,255,.07)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      borderRadius: 999,
                      background: 'linear-gradient(90deg, #5FD97A, #F0A93D)',
                      boxShadow: '0 0 10px rgba(95,217,122,.35)',
                      transition: 'width .7s cubic-bezier(.4,0,.2,1)',
                    }}
                  />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: '#5FD97A', width: 34, textAlign: 'right' }}>
                  {progress}%
                </span>
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}
