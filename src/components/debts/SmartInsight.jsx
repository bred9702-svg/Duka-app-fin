import Icon from '../ui/Icon'
import { fmtKES } from '../../utils/formatters'

export default function SmartInsight({ customers = [] }) {
  const debtors = customers
    .filter(c => (c.total_owed || 0) > 0)
    .sort((a, b) => (b.total_owed || 0) - (a.total_owed || 0))

  if (debtors.length === 0) return null

  const top = debtors[0]

  let title = 'Smart Insight'
  let message = `Collect from ${top.name} first.`

  if ((top.total_owed || 0) > 5000) {
    message = `${top.name} owes ${fmtKES(top.total_owed)} KES. This should be your priority today.`
  } else if ((top.total_owed || 0) > 2000) {
    message = `${top.name} still owes ${fmtKES(top.total_owed)} KES. A quick reminder could improve today's cash flow.`
  } else {
    message = `${top.name} only owes ${fmtKES(top.total_owed)} KES. It's a good opportunity to close this debt.`
  }

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        background:
          'linear-gradient(135deg, rgba(91,159,240,.12), rgba(91,159,240,.05))',
        border: '1px solid rgba(91,159,240,.18)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'rgba(91,159,240,.18)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Icon
            name="sparkles"
            size={18}
            color="#5B9FF0"
          />
        </div>

        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              color: '#5B9FF0',
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {title}
          </p>

          <p
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              color: 'var(--text-hi)',
            }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
