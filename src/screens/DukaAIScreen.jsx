import { useState } from 'react'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'

import StaggerContainer from '../components/animation/StaggerContainer'

import { getDailyAIBrief } from '../utils/dailyAIBrief'
import { getDukaAIInsights } from '../utils/dukaAIInsights'
import { getDukaAIRecommendations } from '../utils/dukaAIRecommendations'
import { fmtKES } from '../utils/formatters'
import { askDukwiseAI } from '../lib/dukwiseAI'

const QUICK_QUESTIONS = [
  'What should I restock first?',
  'Which products should I bundle?',
  'Why did my profit drop?',
  'Who owes me the most?',
  'How can I increase weekend sales?',
]

function CollapsibleSection({ id, title, expanded, onToggle, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        onClick={() => onToggle(id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '10px 2px',
          margin: '14px 0 4px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-low)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
          }}
        >
          {title}
        </p>
        <Icon
          name="chevronRight"
          size={14}
          color="var(--text-low)"
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        />
      </div>
      {expanded && children}
    </div>
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

function BriefMetric({ label, value, detail, color = 'var(--text-hi)' }) {
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
        />
        <BriefMetric
          label="Today's expenses"
          value={`${fmtKES(brief.todayExpenses)} KES`}
        />
        <BriefMetric
          label="Estimated profit"
          value={`${fmtKES(brief.estimatedProfit)} KES`}
          color={brief.estimatedProfit >= 0 ? 'var(--text-hi)' : '#FF6B5B'}
        />
        <BriefMetric
          label="Best seller"
          value={brief.bestSellingProduct.label}
          detail={brief.bestSellingProduct.detail}
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
          color={brief.outstandingDebts.count > 0 ? '#F0A93D' : '#5FD97A'}
        />
        {brief.employeePerformance.exists && (
          <BriefMetric
            label="Employee performance"
            value={brief.employeePerformance.label}
            detail={brief.employeePerformance.detail}
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

function DukwiseAIChat({ shopId }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState(null)

  async function submitQuestion(value = question) {
    const trimmed = String(value || '').trim()
    if (!trimmed || sending) return

    const previousMessages = messages
    const userMessage = { role: 'user', content: trimmed }
    setMessages([...previousMessages, userMessage])
    setQuestion('')
    setError('')
    setSending(true)

    try {
      const result = await askDukwiseAI({
        shopId,
        question: trimmed,
        history: previousMessages,
      })
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: result.answer },
      ])
      setRemaining(result.remaining_today)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitQuestion()
    }
  }

  return (
    <div
      style={{
        background: 'var(--glass-fill-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
      }}
    >
      {messages.length === 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 4 }}>
            Ask about your shop
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-low)', lineHeight: 1.45 }}>
            Get answers grounded in your business data and Wines &amp; Spirits retail expertise.
          </p>
        </div>
      )}

      {messages.length > 0 && (
        <div style={{ display: 'grid', gap: 9, marginBottom: 12 }}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              style={{
                justifySelf: message.role === 'user' ? 'end' : 'start',
                maxWidth: '88%',
                padding: '10px 12px',
                borderRadius: message.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: message.role === 'user' ? 'rgba(240,169,61,0.18)' : 'rgba(255,255,255,0.055)',
                border: message.role === 'user' ? '1px solid rgba(240,169,61,0.25)' : '1px solid var(--glass-border)',
                color: 'var(--text-hi)',
                fontSize: 11,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}
            >
              {message.content}
            </div>
          ))}
          {sending && (
            <div style={{ fontSize: 10, color: 'var(--text-low)', padding: '4px 2px' }}>
              Dukwise AI is analysing your shop...
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 9 }}>
        {QUICK_QUESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            disabled={sending}
            onClick={() => submitQuestion(item)}
            style={{
              flexShrink: 0,
              border: '1px solid var(--glass-border)',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-low)',
              padding: '7px 10px',
              fontSize: 9,
              cursor: sending ? 'default' : 'pointer',
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Dukwise AI..."
          rows={2}
          maxLength={1200}
          disabled={sending}
          style={{
            flex: 1,
            resize: 'none',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            background: 'rgba(0,0,0,0.12)',
            color: 'var(--text-hi)',
            padding: '10px 11px',
            fontFamily: 'inherit',
            fontSize: 11,
            lineHeight: 1.4,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => submitQuestion()}
          disabled={sending || !question.trim()}
          style={{
            height: 38,
            minWidth: 58,
            border: 0,
            borderRadius: 11,
            background: '#F0A93D',
            color: '#17120A',
            fontSize: 10,
            fontWeight: 700,
            opacity: sending || !question.trim() ? 0.5 : 1,
            cursor: sending || !question.trim() ? 'default' : 'pointer',
          }}
        >
          Send
        </button>
      </div>

      {error && (
        <p style={{ marginTop: 8, fontSize: 10, color: '#FF6B5B', lineHeight: 1.4 }}>
          {error}
        </p>
      )}
      {remaining !== null && (
        <p style={{ marginTop: 8, fontSize: 9, color: 'var(--text-low)' }}>
          {remaining} questions remaining today
        </p>
      )}
    </div>
  )
}

export default function DukaAIScreen() {
  const products = useAppStore((s) => s.products)
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const businessPreferences = useAppStore((s) => s.businessPreferences)
  const shopId = useAppStore((s) => s.session?.shopId)

  const dailyBrief = getDailyAIBrief({ products, transactions, customers })
  const insights = getDukaAIInsights({ products, transactions, customers })
  const recommendations = getDukaAIRecommendations({ products, transactions, customers })

  const [expandedSection, setExpandedSection] = useState('brief')

  function toggleSection(id) {
    setExpandedSection((current) => (current === id ? null : id))
  }

  const salesInsights = insights.filter(
    (i) => i.id === 'sales-trend-insight' || i.id === 'top-product-insight'
  )
  const inventoryInsights = insights.filter((i) => i.id === 'stock-insight')
  const debtInsights = insights.filter((i) => i.id === 'debt-risk-insight')
  const recommendedAction = insights.filter((i) => i.id === 'recommended-action')

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 220, height: 220, top: -40, right: -40, background: 'rgba(240,169,61,0.14)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Dukwise AI" />

        <p style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5, marginBottom: 16 }}>
          Your business intelligence and Wines &amp; Spirits expert in one assistant.
        </p>

        <DukwiseAIChat shopId={shopId} />

        {businessPreferences.dailyAiBrief !== false && (
          <CollapsibleSection
            id="brief"
            title="Daily AI Brief"
            expanded={expandedSection === 'brief'}
            onToggle={toggleSection}
          >
            <DailyBriefCard brief={dailyBrief} />
          </CollapsibleSection>
        )}

        <CollapsibleSection
          id="recommendations"
          title="Recommendations"
          expanded={expandedSection === 'recommendations'}
          onToggle={toggleSection}
        >
          <StaggerContainer step={60} initialDelay={40}>
            {recommendedAction.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
            {recommendations.map((rec) => (
              <InsightCard key={rec.id} insight={rec} />
            ))}
          </StaggerContainer>
        </CollapsibleSection>

        <CollapsibleSection
          id="sales"
          title="Sales"
          expanded={expandedSection === 'sales'}
          onToggle={toggleSection}
        >
          <StaggerContainer step={60} initialDelay={40}>
            {salesInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </StaggerContainer>
        </CollapsibleSection>

        <CollapsibleSection
          id="inventory"
          title="Inventory"
          expanded={expandedSection === 'inventory'}
          onToggle={toggleSection}
        >
          <StaggerContainer step={60} initialDelay={40}>
            {inventoryInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </StaggerContainer>
        </CollapsibleSection>

        <CollapsibleSection
          id="debts"
          title="Debts"
          expanded={expandedSection === 'debts'}
          onToggle={toggleSection}
        >
          <StaggerContainer step={60} initialDelay={40}>
            {debtInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </StaggerContainer>
        </CollapsibleSection>
      </div>
    </div>
  )
}
