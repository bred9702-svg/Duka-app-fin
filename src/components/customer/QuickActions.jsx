import Icon from '../ui/Icon'

export default function QuickActions({
  customer,
  onCall,
  onWhatsApp,
  onRecordPayment,
  onViewHistory,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 18,
      }}
    >
      <ActionButton
        icon="phone"
        label="Call"
        color="#5B9FF0"
        onClick={onCall}
      />

      <ActionButton
        icon="messageCircle"
        label="WhatsApp"
        color="#5FD97A"
        onClick={onWhatsApp}
      />

      <ActionButton
        icon="wallet"
        label="Record Payment"
        color="#F0A93D"
        onClick={onRecordPayment}
      />

      <ActionButton
        icon="receipt"
        label="Transactions"
        color="#B58CFF"
        onClick={onViewHistory}
      />
    </div>
  )
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none',

        borderRadius: 16,

        padding: 16,

        cursor: 'pointer',

        background: 'var(--glass-fill-soft)',

        border: '1px solid var(--glass-border)',

        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,

        transition: '.2s',
      }}
    >
      <Icon
        name={icon}
        size={22}
        color={color}
      />

      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-hi)',
        }}
      >
        {label}
      </span>
    </button>
  )
}
