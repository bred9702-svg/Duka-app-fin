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
      barColor: '#FF6B5B',
      iconBg: 'rgba(255,107,91,.14)',
      iconFg: '#FF6B5B',
      tagBg: 'rgba(255,107,91,.12)',
      tagLabel: 'Debt',
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
      barColor: '#5FD97A',
      iconBg: 'rgba(95,217,122,.14)',
      iconFg: '#5FD97A',
      tagBg: 'rgba(95,217,122,.12)',
      tagLabel: 'Payment',
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
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-low)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        Customer Timeline
      </p>

      {events.length === 0 ? (
        <div
          style={{
            padding: '16px',
            borderRadius: 12,
            textAlign: 'center',
            background: 'var(--glass-fill-soft)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--text-low)' }}>
            No activity yet
          </p>
        </div>
      ) : (
        events.map((event, i) => (
          <div
            key={event.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 11px',
              marginBottom: 6,
              borderRadius: 12,
              background: 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid var(--glass-border)',
              animation: 'slideUp .35s ease-out backwards',
              animationDelay: `${i * 0.05}s`,
            }}
          >
            {/* Left color bar */}
            <div
              style={{
                width: 3,
                height: 34,
                alignSelf: 'center',
                borderRadius: 999,
                background: event.barColor,
                flexShrink: 0,
              }}
            />

            {/* Icon */}
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: event.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon
                name={event.icon}
                size={14}
                color={event.iconFg}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 7px',
                  marginBottom: 4,
                  fontSize: 8,
                  letterSpacing: '.02em',
                  fontWeight: 600,
                  background: event.tagBg,
                  color: event.barColor,
                }}
              >
                {event.tagLabel}
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '-.01em',
                  color: 'var(--text-hi)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {event.title}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2,
                  fontSize: 8,
                  opacity: 0.65,
                  color: 'var(--text-low)',
                }}
              >
                <span>{event.subtitle}</span>
                <span>•</span>
                <span>{fmtShortDate(event.date)}</span>
              </div>
            </div>

            {/* Amount */}
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '-.02em',
                color: event.type === 'payment' ? '#5FD97A' : '#FF6B5B',
                flexShrink: 0,
              }}
            >
              {event.type === 'payment' ? '+' : '-'}
              {fmtKES(event.amount)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
