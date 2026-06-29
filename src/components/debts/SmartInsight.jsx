import Icon from '../ui/Icon'
import { generateSmartInsight } from '../../utils/smartInsight'

export default function SmartInsight({
  customers = [],
  transactions = [],
}) {
  const insight = generateSmartInsight(customers, transactions)

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        background: `${insight.color}15`,
        border: `1px solid ${insight.color}40`,
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
            background: `${insight.color}25`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Icon
            name={insight.icon}
            size={18}
            color={insight.color}
          />
        </div>

        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              color: insight.color,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {insight.title}
          </p>

          <p
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              color: 'var(--text-hi)',
            }}
          >
            {insight.message}
          </p>
        </div>
      </div>
    </div>
  )
}
