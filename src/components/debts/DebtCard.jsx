import Avatar from '../ui/Avatar'
import Icon from '../ui/Icon'
import { fmtKES } from '../../utils/formatters'

function getStatus(customer) {
  const debt = customer.total_owed || 0

  if (debt <= 0) {
    return {
      label: 'Paid',
      color: '#5FD97A',
      bg: 'rgba(95,217,122,.12)',
      icon: 'circleCheck',
    }
  }

  // Plus tard on remplacera cette logique
  // par la vraie date d'échéance.
  if (debt > 5000) {
    return {
      label: 'Overdue',
      color: '#FF6B5B',
      bg: 'rgba(255,107,91,.12)',
      icon: 'alertCircle',
    }
  }

  if (debt > 2000) {
    return {
      label: 'Due soon',
      color: '#F0A93D',
      bg: 'rgba(240,169,61,.12)',
      icon: 'clock',
    }
  }

  return {
    label: 'Pending',
    color: '#5B9FF0',
    bg: 'rgba(91,159,240,.12)',
    icon: 'wallet',
  }
}

export default function DebtCard({
  customer,
  color,
  onClick,
  delay = 0,
  activeDebtCount = 0,
  lastPaymentLabel = 'Never',
}) {
  const status = getStatus(customer)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,

        padding: 14,

        marginBottom: 10,

        cursor: 'pointer',

        borderRadius: 18,

        background: 'var(--glass-fill-soft)',

        border: '1px solid var(--glass-border)',

        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',

        animation: 'slideUp .45s ease-out backwards',
        animationDelay: `${delay}s`,

        transition: '.2s',
      }}
    >
      <Avatar
        name={customer.name}
        color={color}
        size={42}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-hi)',
            marginBottom: 6,
          }}
        >
          {customer.name}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,

              padding: '4px 8px',

              borderRadius: 999,

              background: status.bg,
            }}
          >
            <Icon
              name={status.icon}
              size={11}
              color={status.color}
            />

            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: status.color,
              }}
            >
              {status.label}
            </span>
          </div>

          <span style={{ fontSize: 10, color: 'var(--text-low)' }}>
            {activeDebtCount} active
          </span>
        </div>

        <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 6 }}>
          Last payment · {lastPaymentLabel}
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
            fontWeight: 700,
            fontSize: 16,
            color:
              customer.total_owed > 0
                ? '#FF6B5B'
                : '#5FD97A',
          }}
        >
          {fmtKES(customer.total_owed || 0)}
        </p>

        <p
          style={{
            fontSize: 10,
            color: 'var(--text-low)',
            marginTop: 2,
          }}
        >
          outstanding
        </p>
      </div>

      <Icon
        name="chevronRight"
        size={17}
        color="var(--text-low)"
      />
    </div>
  )
}
