import Card from '../ui/Card'
import Icon from '../ui/Icon'
import { fmtKES, fmtShortDate } from '../../utils/formatters'

export default function CustomerTimeline({
  debts = [],
  payments = [],
}) {
  const events = [
    ...debts.map((debt) => ({
      id: `debt-${debt.id}`,
      type: 'debt',
      date: debt.created_at || debt.ts,
      title: debt.product_name || debt.productName || 'Credit Sale',
      subtitle: `Qty ${debt.quantity || 1}`,
      amount: debt.total_price || debt.amount || 0,
      color: '#FF6B5B',
      icon: 'receiptOff',
    })),

    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      type: 'payment',
      date:
        payment.paid_at ||
        payment.created_at ||
        payment.ts,
      title: 'Payment',
      subtitle: payment.payment_method || 'Cash',
      amount: payment.amount || 0,
      color: '#5FD97A',
      icon: 'circleCheck',
    })),
  ].sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  )

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
        Customer Timeline
      </p>

      {events.length === 0 ? (
        <Card>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-low)',
            }}
          >
            No activity yet
          </p>
        </Card>
      ) : (
        events.map((event) => (
          <Card
            key={event.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `${event.color}18`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon
                name={event.icon}
                size={18}
                color={event.color}
              />
            </div>

            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontWeight: 600,
                  color: 'var(--text-hi)',
                }}
              >
                {event.title}
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-low)',
                }}
              >
                {event.subtitle}
              </p>

              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text-low)',
                  marginTop: 4,
                }}
              >
                {fmtShortDate(event.date)}
              </p>
            </div>

            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: event.color,
              }}
            >
              {event.type === 'payment' ? '+' : '-'}
              {fmtKES(event.amount)}
            </p>
          </Card>
        ))
      )}
    </div>
  )
}
