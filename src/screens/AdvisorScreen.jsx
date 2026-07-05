import { useState, useRef, useEffect } from 'react'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'
import { fmtKES } from '../utils/formatters'

import {
  getInventoryHealth,
  getBestSeller,
  getHighestProfit,
  getLowStock,
  getOutOfStock,
  getDeadStock,
  getRestockSuggestions,
} from '../utils/inventoryEngine'

import {
  getBusinessScore,
  getGreeting,
  getBriefingSummary,
  getPriorities,
  getRecommendations,
  getPredictions,
  getRiskAlerts,
  generateMockResponse,
} from '../utils/aiAdvisorEngine'

const CHIPS = [
  'What should I restock?',
  'Why did my profit drop?',
  'Who owes me money?',
  'Predict this weekend.',
  'How can I increase sales?',
]

function SectionTitle({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
      color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em',
      margin: '18px 0 8px',
    }}>
      {children}
    </p>
  )
}

function GlassCard({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--glass-fill-soft)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid var(--glass-border)', borderRadius: 14,
      padding: '12px 14px', marginBottom: 8,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>
      {children}
    </div>
  )
}

export default function AdvisorScreen() {
  const products = useAppStore((s) => s.products)
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)

  const health = getInventoryHealth(products)
  const bestSeller = getBestSeller(products, transactions)
  const highestProfit = getHighestProfit(products, transactions)
  const lowStock = getLowStock(products)
  const outOfStock = getOutOfStock(products)
  const deadStock = getDeadStock(products, transactions)
  const restockSuggestions = getRestockSuggestions(products, transactions)
  const debtors = customers.filter(c => (c.total_owed || 0) > 0).sort((a, b) => b.total_owed - a.total_owed)
  const topDebtor = debtors[0] || null

  // Revenue delta (this week vs last week)
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const sales = transactions.filter(t => t.operation_type === 'sale')
  const thisWeek = sales.filter(t => new Date(t.created_at || t.ts || now).getTime() >= now - weekMs)
  const lastWeek = sales.filter(t => {
    const ts = new Date(t.created_at || t.ts || now).getTime()
    return ts >= now - weekMs * 2 && ts < now - weekMs
  })
  const thisWeekTotal = thisWeek.reduce((a, t) => a + t.amount, 0)
  const lastWeekTotal = lastWeek.reduce((a, t) => a + t.amount, 0)
  const revenueDelta = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : null

  const expenses = transactions.filter(t => t.operation_type === 'expense')
  const thisWeekExpenses = expenses.filter(t => new Date(t.created_at || t.ts || now).getTime() >= now - weekMs)
  const expensesTotal = thisWeekExpenses.reduce((a, t) => a + t.amount, 0)
  const profitTotal = thisWeekTotal - expensesTotal
  const debtsTotal = debtors.reduce((a, c) => a + (c.total_owed || 0), 0)

  const score = getBusinessScore({ health, revenueDelta, debtsTotal, revenue: thisWeekTotal })
  const greeting = getGreeting()
  const summary = getBriefingSummary({ score, revenueDelta, topDebtor, lowStock })
  const priorities = getPriorities({ restockSuggestions, topDebtor, deadStock, outOfStock })
  const recommendations = getRecommendations({ bestSeller, highestProfit, deadStock, lowStock })
  const predictions = getPredictions({ transactions })
  const risks = getRiskAlerts({ lowStock, outOfStock, debtors, transactions })

  const context = { restockSuggestions, debtors, bestSeller, lowStock, predictions }

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function ask(question) {
    if (!question.trim()) return
    const answer = generateMockResponse(question, context)
    setMessages(m => [...m, { role: 'user', text: question }, { role: 'ai', text: answer }])
    setInput('')
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 220, height: 220, top: -40, right: -40, background: 'rgba(240,169,61,0.14)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="AI Advisor" />

        {/* Business Briefing */}
        <GlassCard style={{ background: 'linear-gradient(160deg, rgba(240,169,61,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(240,169,61,0.20)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>
            {greeting}, here's your business briefing
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: '#F0A93D' }}>
              {score.score}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-low)' }}>
              / 100 · {score.label}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5 }}>
            {summary}
          </p>
        </GlassCard>

        {/* Today's Priorities */}
        <SectionTitle>Today's Priorities</SectionTitle>
        {priorities.map((p, i) => (
          <GlassCard key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${p.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: p.color }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{p.label}</p>
              <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{p.detail}</p>
            </div>
            <Icon name={p.icon} size={16} color={p.color} />
          </GlassCard>
        ))}

        {/* Business Summary */}
        <SectionTitle>Business Summary</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, marginBottom: 8 }}>
          <GlassCard style={{ marginBottom: 0 }}>
            <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Revenue</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#5FD97A' }}>{fmtKES(thisWeekTotal)} KES</p>
          </GlassCard>
          <GlassCard style={{ marginBottom: 0 }}>
            <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Profit</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0A93D' }}>{fmtKES(profitTotal)} KES</p>
          </GlassCard>
          <GlassCard style={{ marginBottom: 0 }}>
            <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Expenses</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#FF6B5B' }}>{fmtKES(expensesTotal)} KES</p>
          </GlassCard>
          <GlassCard style={{ marginBottom: 0 }}>
            <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Inventory Health</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: health.color }}>{health.score}</p>
          </GlassCard>
        </div>

        {/* AI Recommendations */}
        <SectionTitle>AI Recommendations</SectionTitle>
        {recommendations.map((r, i) => (
          <GlassCard key={i} style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${r.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={r.icon} size={14} color={r.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 3 }}>{r.title}</p>
              <p style={{ fontSize: 10, color: 'var(--text-low)', lineHeight: 1.4 }}>{r.detail}</p>
            </div>
          </GlassCard>
        ))}

        {/* Predictions */}
        <SectionTitle>Predictions</SectionTitle>
        <GlassCard>
          {predictions.tomorrowRevenue === null ? (
            <p style={{ fontSize: 12, color: 'var(--text-low)' }}>{predictions.outlook}</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Tomorrow's estimated revenue</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-hi)' }}>{fmtKES(predictions.tomorrowRevenue)} KES</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Confidence</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#5FD97A' }}>{predictions.confidence}%</p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5, borderTop: '1px solid var(--glass-border)', paddingTop: 8 }}>
                {predictions.outlook}
              </p>
            </>
          )}
        </GlassCard>

        {/* Risk Alerts */}
        {risks.length > 0 && (
          <>
            <SectionTitle>Risk Alerts</SectionTitle>
            {risks.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 12, marginBottom: 8,
                background: `${r.color}12`, border: `1px solid ${r.color}30`,
              }}>
                <Icon name={r.icon} size={16} color={r.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{r.title}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>{r.detail}</p>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Ask Duka AI */}
        <SectionTitle>Ask Duka AI</SectionTitle>

        {messages.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '9px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  lineHeight: 1.45,
                  background: m.role === 'user' ? 'rgba(240,169,61,0.16)' : 'var(--glass-fill-soft)',
                  border: m.role === 'user' ? '1px solid rgba(240,169,61,0.3)' : '1px solid var(--glass-border)',
                  color: m.role === 'user' ? '#F0A93D' : 'var(--text-hi)',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 4 }}>
          {CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => ask(chip)}
              style={{
                flexShrink: 0,
                padding: '7px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--text-mid)',
                background: 'var(--glass-fill-soft)',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px 6px 14px',
          borderRadius: 999, background: 'var(--glass-fill-soft)',
          border: '1px solid var(--glass-border)', marginBottom: 90,
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask(input)}
            placeholder="Ask Duka AI anything about your business..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 12, color: 'var(--text-hi)', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => ask(input)}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#F0A93D', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Icon name="chevronRight" size={16} color="#0F1117" style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
