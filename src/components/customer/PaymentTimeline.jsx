import Card from '../ui/Card'
import { fmtKES, fmtShortDate } from '../../utils/formatters'

export default function PaymentTimeline({ payments = [] }) {
  return (
    <div>
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
        Payment History
      </p>

      {payments.length === 0 ? (
        <Card>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-low)',
              fontSize: 13,
            }}
          >
            No payments yet
          </p>
        </Card>
      ) : (
        payments.map((payment) => (
          <Card
            key={payment.id || payment.date}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div>
              <p
                style={{
                  fontWeight: 600,
                  color: 'var(--text-hi)',
                }}
              >
                Payment
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-low)',
                }}
              >
                {fmtShortDate(payment.paid_at || payment.created_at || payment.date || payment.ts)}
              </p>
            </div>

            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: '#5FD97A',
              }}
            >
              +{fmtKES(payment.amount)}
            </p>
          </Card>
        ))
      )}
    </div>
  )
}
