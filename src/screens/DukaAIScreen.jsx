import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'

import StaggerContainer from '../components/animation/StaggerContainer'

import { getDailyAIBrief } from '../utils/dailyAIBrief'
import { getDukaAIInsights } from '../utils/dukaAIInsights'
import { getDukaAIRecommendations } from '../utils/dukaAIRecommendations'
import { fmtKES } from '../utils/formatters'

function SectionTitle({ children }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-low)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: '18px 0 8px',
      }}
    >
      {children}
    </p>
  )
}

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

function BriefMetric({ label, value, detail, color = '#5B9FF0' }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '10px 11px',
      }}
    >
      <p
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 5,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 700,
          color,
          marginBottom: detail ? 3 : 0,
          lineHeight: 1.25,
        }}
      >
        {value}
      </p>
      {detail && (
        <p style={{ fontSize: 10, color: 'var(--text-low)', lineHeight: 1.35 }}>
          {detail}
        </p>
      )}
    </div>
  )
}

function DailyBriefCard({ brief }) {
  return (
    <div
      style={{
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'rgba(240,169,61,0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="sparkles" size={17} color="#F0A93D" />
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
            Generated once today
          </p>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-hi)',
              lineHeight: 1.35,
            }}
          >
            Daily business brief
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <BriefMetric
          label="Today's sales"
          value={`${fmtKES(brief.todaySales)} KES`}
          color="#5FD97A"
        />
        <BriefMetric
          label="Today's expenses"
          value={`${fmtKES(brief.todayExpenses)} KES`}
          color="#FF8A4C"
        />
        <BriefMetric
          label="Estimated profit"
          value={`${fmtKES(brief.estimatedProfit)} KES`}
          color={brief.estimatedProfit >= 0 ? '#5FD97A' : '#FF6B5B'}
        />
        <BriefMetric
          label="Best seller"
          value={brief.bestSellingProduct.label}
          detail={brief.bestSellingProduct.detail}
          color="#F0A93D"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <BriefMetric
          label="Low-stock products"
          value={brief.lowStockProducts.label}
          detail={brief.lowStockProducts.detail}
          color={brief.lowStockProducts.count > 0 ? '#F0A93D' : '#5FD97A'}
        />
        <BriefMetric
          label="Outstanding debts"
          value={brief.outstandingDebts.label}
          detail={brief.outstandingDebts.detail}
          color={brief.outstandingDebts.count > 0 ? '#FF8A4C' : '#5FD97A'}
        />
        {brief.employeePerformance.exists && (
          <BriefMetric
            label="Employee performance"
            value={brief.employeePerformance.label}
            detail={brief.employeePerformance.detail}
            color="#7C5CFC"
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          background: 'rgba(240,169,61,0.10)',
          border: '1px solid rgba(240,169,61,0.20)',
          borderRadius: 13,
          padding: '10px 11px',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            background: 'rgba(240,169,61,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="circleCheck" size={15} color="#F0A93D" />
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
            Priority today
          </p>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-hi)',
              marginBottom: 4,
              lineHeight: 1.35,
            }}
          >
            {brief.recommendation.title}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.45 }}>
            {brief.recommendation.detail}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DukaAIScreen() {
  const products = useAppStore((s) => s.products)
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const businessPreferences = useAppStore((s) => s.businessPreferences)

  const dailyBrief = getDailyAIBrief({ products, transactions, customers })
  const insights = getDukaAIInsights({ products, transactions, customers })
  const recommendations = getDukaAIRecommendations({ products, transactions, customers })

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

        {businessPreferences.dailyAiBrief !== false && (
          <>
            <SectionTitle>Daily AI Brief</SectionTitle>
            <DailyBriefCard brief={dailyBrief} />
          </>
        )}

        <StaggerContainer step={60} initialDelay={40}>
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </StaggerContainer>

        <SectionTitle>Recommendations</SectionTitle>
        <StaggerContainer step={60} initialDelay={40}>
          {recommendations.map((rec) => (
            <InsightCard key={rec.id} insight={rec} />
          ))}
        </StaggerContainer>
      </div>
    </div>
  )
}
