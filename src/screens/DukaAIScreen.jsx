import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'

import StaggerContainer from '../components/animation/StaggerContainer'

import { getDukaAIInsights } from '../utils/dukaAIInsights'

function InsightCard({ insight }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: `${insight.color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={insight.icon} size={16} color={insight.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 9,
            fontWeight: 600,
            color: 'var(--text-low)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 4,
          }}
        >
          {insight.title}
        </p>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-hi)',
            marginBottom: 4,
            lineHeight: 1.35,
          }}
        >
          {insight.headline}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.45 }}>
          {insight.detail}
        </p>
      </div>
    </div>
  )
}

export default function DukaAIScreen() {
  const products = useAppStore((s) => s.products)
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)

  const insights = getDukaAIInsights({ products, transactions, customers })

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 220, height: 220, top: -40, right: -40, background: 'rgba(240,169,61,0.14)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Duka AI" />

        <p style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5, marginBottom: 16 }}>
          A quick, rule-based read of your business — no chat, just the essentials.
        </p>

        <StaggerContainer step={60} initialDelay={40}>
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </StaggerContainer>
      </div>
    </div>
  )
}
