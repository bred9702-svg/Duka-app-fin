import Icon from '../ui/Icon'
import { fmtKES, fmtTime } from '../../utils/formatters'

export default function TransactionRow({ txn, customers, onClick, delay = 0 }) {
  const isIn = txn.direction === 'in'
  const isMpesa = txn.source === 'mpesa'
  const isClassified = txn.classified
  const opType = txn.operation_type

  let dotColor = '#7A715A'
  let iconName = isMpesa ? 'phone' : 'cash'
  let iconBg = isIn ? 'rgba(95,217,122,0.18)' : 'rgba(255,107,91,0.18)'
  let iconFg = isIn ? '#5FD97A' : '#FF6B5B'
  let title = ''
  let subtitle = ''

  if (isClassified && opType) {
    if (opType === 'sale') {
      title = txn.product?.name || 'Sale'
      subtitle = `Sale · ${fmtKES(txn.amount)} KES`
      iconName = 'bottle'
      iconBg = 'rgba(240,169,61,0.18)'
      iconFg = '#F0A93D'
      dotColor = '#F0A93D'
    } else if (opType === 'expense') {
      title = txn.expense_category
        ? txn.expense_category.charAt(0).toUpperCase() + txn.expense_category.slice(1)
        : 'Expense'
      subtitle = `Expense · ${fmtKES(txn.amount)} KES`
      iconName = 'receiptOff'
      iconBg = 'rgba(255,107,91,0.18)'
      iconFg = '#FF6B5B'
      dotColor = '#FF6B5B'
    } else if (opType === 'debt') {
      const custName =
        txn.customer?.name ||
        customers?.find(c => c.id === txn.customer_id)?.name ||
        'Customer'
      title = custName
      subtitle = `Debt · ${fmtKES(txn.amount)} KES`
      iconName = 'userDollar'
      iconBg = 'rgba(91,159,240,0.18)'
      iconFg = '#5B9FF0'
      dotColor = '#5B9FF0'
    }
  } else {
    title = txn.mpesa_sender_name || (isMpesa
      ? (isIn ? 'M-Pesa received' : 'M-Pesa sent')
      : (isIn ? 'Cash received' : 'Cash paid out'))
    subtitle = `${isMpesa ? 'M-Pesa' : 'Cash'} · ${isIn ? 'Possible sale' : 'Possible expense'}`
  }

  const timestamp = txn.created_at || txn.ts

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: isClassified ? 'var(--glass-fill-soft)' : 'rgba(240,169,61,0.06)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: isClassified ? '1px solid var(--glass-border)' : '1px solid rgba(240,169,61,0.35)',
        borderRadius: 12,
        marginBottom: 7,
        cursor: onClick ? 'pointer' : 'default',
        animation: 'slideUp 0.4s ease-out backwards',
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isClassified ? dotColor : '#F0A93D', flexShrink: 0, boxShadow: `0 0 6px ${isClassified ? dotColor : '#F0A93D'}88` }} />
      <div style={{ width: 32, height: 32, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={iconName} size={15} color={iconFg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-low)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          {subtitle}
          <span style={{ opacity: 0.5 }}>·</span>
          {fmtTime(timestamp)}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: isIn ? '#5FD97A' : '#FF6B5B' }}>
          {(isIn ? '+' : '-') + fmtKES(txn.amount)}
        </p>
        {!isClassified && (
          <p style={{ fontSize: 9, color: '#F0A93D', fontWeight: 600, marginTop: 2 }}>
            Classify →
          </p>
        )}
      </div>
    </div>
  )
}
