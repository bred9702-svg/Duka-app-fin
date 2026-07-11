import { useMemo, useState } from 'react'

import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'

import StaggerContainer from '../components/animation/StaggerContainer'

import { getDukaAIInsights } from '../utils/dukaAIInsights'
import { getDukaAIRecommendations } from '../utils/dukaAIRecommendations'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'sales', label: 'Sales' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'debts', label: 'Debts' },
]

const TAB_CONFIG = {
  overview: {
    title: 'Overview',
    description: 'Your highest-priority business signals in one place.',
    insightIds: [
      'sales-trend-insight',
      'stock-insight',
      'debt-risk-insight',
      'top-product-insight',
      'recommended-action',
    ],
    recommendationIds: [],
  },
  recommendations: {
    title: 'Recommendations',
    description: 'Action cards generated from your current business data.',
    insightIds: [],
    recommendationIds: [
      'restock-recommendation',
      'debt-followup-recommendation',
      'underperformer-recommendation',
      'fastest-seller-recommendation',
      'priority-action-recommendation',
    ],
  },
  sales: {
    title: 'Sales',
    description: 'Sales trends and product movement insights.',
    insightIds: [
      'sales-trend-insight',
      'top-product-insight',
    ],
    recommendationIds: [
      'fastest-seller-recommendation',
    ],
  },
  inventory: {
    title: 'Inventory',
    description: 'Stock health, restocking, and underperforming product insights.',
    insightIds: [
      'stock-insight',
      'top-product-insight',
    ],
    recommendationIds: [
      'restock-recommendation',
      'underperformer-recommendation',
    ],
  },
  debts: {
    title: 'Debts',
    description: 'Debt risk and follow-up priorities.',
    insightIds: [
      'debt-risk-insight',
    ],
    recommendationIds: [
      'debt-followup-recommendation',
    ],
  },
}

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

function TabBar({ activeTab, onChange }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 4,
        margin: '0 -14px 14px',
        padding: '8px 14px 10px',
        background: 'linear-gradient(180deg, var(--bg) 0%, rgba(10,10,16,0.86) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              style={{
                border: `1px solid ${isActive ? 'rgba(240,169,61,0.48)' : 'var(--glass-border)'}`,
                borderRadius: 999,
                padding: '8px 12px',
                background: isActive ? 'rgba(240,169,61,0.16)' : 'var(--glass-fill-soft)',
                color: isActive ? '#F0A93D' : 'var(--text-low)',
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                boxShadow: isActive ? '0 8px 24px rgba(240,169,61,0.10)' : 'none',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getCardsByIds(cards, ids) {
  return ids.map((id) => cards.find((card) => card.id === id)).filter(Boolean)
}

export default function DukaAIScreen() {
  const products = useAppStore((s) => s.products)
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const [activeTab, setActiveTab] = useState('overview')

  const insights = useMemo(
    () => getDukaAIInsights({ products, transactions, customers }),
    [products, transactions, customers]
  )

  const recommendations = useMemo(
    () => getDukaAIRecommendations({ products, transactions, customers }),
    [products, transactions, customers]
  )

  const config = TAB_CONFIG[activeTab] || TAB_CONFIG.overview
  const visibleInsights = getCardsByIds(insights, config.insightIds)
  const visibleRecommendations = getCardsByIds(recommendations, config.recommendationIds)

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

        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        <SectionTitle>{config.title}</SectionTitle>
        <p style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5, marginBottom: 10 }}>
          {config.description}
        </p>

        {visibleInsights.length > 0 && (
          <StaggerContainer step={60} initialDelay={40}>
            {visibleInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </StaggerContainer>
        )}

        {visibleRecommendations.length > 0 && (
          <StaggerContainer step={60} initialDelay={40}>
            {visibleRecommendations.map((rec) => (
              <InsightCard key={rec.id} insight={rec} />
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  )
}
