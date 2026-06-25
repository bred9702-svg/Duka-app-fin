import Icon from '../ui/Icon'
import { fmtKES, fmtTime } from '../../utils/formatters'

export default function TransactionRow({
  txn,
  customers,
  onClick,
  delay = 0,
}) {
  const isIn = txn.direction === 'in'
  const isMpesa = txn.source === 'mpesa'
  const isClassified = txn.classified
  const opType = txn.operation_type

  let barColor = '#F0A93D'
  let iconName = isMpesa ? 'phone' : 'cash'
  let iconBg = isIn ? 'rgba(95,217,122,.15)' : 'rgba(255,107,91,.15)'
  let iconFg = isIn ? '#5FD97A' : '#FF6B5B'
  let title = ''
  let subtitle = ''

  if (isClassified && opType) {
    if (opType === 'sale') {
      title = txn.product?.name || 'Sale'
      subtitle = `Sale · ${fmtKES(txn.amount)}`
      iconName = 'bottle'
      iconBg = 'rgba(95,217,122,.14)'
      iconFg = '#5FD97A'
      barColor = '#5FD97A'
    }

    if (opType === 'expense') {
      title =
        txn.expense_category
          ? txn.expense_category.charAt(0).toUpperCase() +
            txn.expense_category.slice(1)
          : 'Expense'

      subtitle = `Expense · ${fmtKES(txn.amount)}`
      iconName = 'receiptOff'
      iconBg = 'rgba(255,107,91,.14)'
      iconFg = '#FF6B5B'
      barColor = '#FF6B5B'
    }

    if (opType === 'debt') {
      const cust =
        txn.customer?.name ||
        customers?.find((c) => c.id === txn.customer_id)?.name ||
        'Customer'

      title = cust
      subtitle = `Debt · ${fmtKES(txn.amount)}`
      iconName = 'userDollar'
      iconBg = 'rgba(91,159,240,.14)'
      iconFg = '#5B9FF0'
      barColor = '#5B9FF0'
    }
  } else {
    title =
      txn.mpesa_sender_name ||
      (isMpesa
        ? isIn
          ? 'M-Pesa received'
          : 'M-Pesa sent'
        : isIn
        ? 'Cash received'
        : 'Cash paid out')

    subtitle = `${isMpesa ? 'M-Pesa' : 'Cash'} • ${
      isIn ? 'Possible sale' : 'Possible expense'
    }`
  }

  const timestamp = txn.created_at || txn.ts

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        marginBottom: 12,
        borderRadius: 14,
        cursor: onClick ? 'pointer' : 'default',
        background: isClassified
          ? 'var(--glass-fill-soft)'
          : 'rgba(240,169,61,.06)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: isClassified
          ? '1px solid var(--glass-border)'
          : '1px solid rgba(240,169,61,.35)',
        animation: 'slideUp .35s ease-out backwards',
        animationDelay: `${delay}s`,
      }}
    >
      {/* Left color bar */}

      <div
        style={{
          width: 4,
          alignSelf: 'stretch',
          borderRadius: 999,
          background: barColor,
          flexShrink: 0,
        }}
      />

      {/* Icon */}

      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon
          name={iconName}
          size={16}
          color={iconFg}
        />
      </div>

      {/* Content */}

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 8px',
            borderRadius: 999,
            marginBottom: 6,
            fontSize: 9,
            fontWeight: 600,
            background:
              opType === 'sale'
                ? 'rgba(95,217,122,.12)'
                : opType === 'expense'
                ? 'rgba(255,107,91,.12)'
                : opType === 'debt'
                ? 'rgba(91,159,240,.12)'
                : 'rgba(240,169,61,.12)',
            color:
              opType === 'sale'
                ? '#5FD97A'
                : opType === 'expense'
                ? '#FF6B5B'
                : opType === 'debt'
                ? '#5B9FF0'
                : '#F0A93D',
          }}
        >
          {isClassified
            ? opType === 'sale'
              ? 'Sale'
              : opType === 'expense'
              ? 'Expense'
              : 'Debt'
            : isMpesa
            ? 'M-Pesa'
            : 'Cash'}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '-.01em',
            color: 'var(--text-hi)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 3,
            fontSize: 9,
            color: 'var(--text-low)',
            opacity: .8,
          }}
        >
          <span>{subtitle}</span>

          <span>•</span>

          <span>{fmtTime(timestamp)}</span>
        </div>
      </div>

      {/* Amount */}

      <div
        style={{
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-.02em',
            color: isIn ? '#5FD97A' : '#FF6B5B',
          }}
        >
          {(isIn ? '+' : '-') + fmtKES(txn.amount)}
        </div>

        {!isClassified && (
          <div
            style={{
              marginTop: 4,
              fontSize: 9,
              fontWeight: 600,
              color: '#F0A93D',
            }}
          >
            Classify →
          </div>
        )}
      </div>
    </div>
  )
}
