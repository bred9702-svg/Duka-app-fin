import { useState, useEffect } from 'react'
import Icon from '../components/ui/Icon'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import { fmtKES } from '../utils/formatters'
import { getTransactions } from '../lib/db'
import { EXPENSE_CATEGORIES } from '../data/mockData'

const PERIODS = [
  { id: 1, label: 'Today' },
  { id: 7, label: 'Week' },
  { id: 30, label: 'Month' },
  { id: 365, label: 'Year' },
]

function healthLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs attention'
}
function healthColor(score) {
  if (score >= 80) return '#5FD97A'
  if (score >= 60) return '#F0A93D'
  if (score >= 40) return '#FF9F43'
  return '#FF6B5B'
}

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

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--glass-fill-soft)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid var(--glass-border)', borderRadius: 14,
      padding: '12px 14px', marginBottom: 8, ...style,
    }}>
      {children}
    </div>
  )
}

function Delta({ value }) {
  if (value === null || value === undefined) return null
  const up = value >= 0
  const color = up ? '#5FD97A' : '#FF6B5B'
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color }}>
      {up ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  )
}

function MonthlyBars({ data }) {
  if (!data || data.every(d => d.profit === 0)) {
    return (
      <p style={{ fontSize: 11, color: 'var(--text-low)', textAlign: 'center', padding: '24px 0' }}>
        Not enough data yet
      </p>
    )
  }
  const max = Math.max(...data.map(d => Math.abs(d.profit)), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginTop: 6 }}>
      {data.map((d, i) => {
        const pct = (Math.abs(d.profit) / max) * 100
        const isMax = Math.abs(d.profit) === max
        const color = d.profit < 0 ? '#FF6B5B' : (isMax ? '#F0A93D' : 'rgba(240,169,61,.4)')
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', height: `${Math.max(pct, 4)}%`, background: color, borderRadius: '4px 4px 0 0' }} />
            <span style={{ fontSize: 7, color: isMax ? '#F0A93D' : 'var(--text-low)', fontWeight: isMax ? 700 : 400 }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function FinancialAnalysisScreen() {
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    revenue: 0, expense: 0, netProfit: 0, margin: 0,
    revenueDelta: null, expenseDelta: null, netProfitDelta: null,
  })
  const [categories, setCategories] = useState([])
  const [monthly, setMonthly] = useState([])
  const [aiTip, setAiTip] = useState('Add more data for insights.')

  useEffect(() => { loadData() }, [period])

  async function loadData() {
    setLoading(true)
    try {
      const transactions = await getTransactions(500)
      const getTime = (t) => new Date(t.created_at || t.ts || Date.now()).getTime()
      const now = Date.now()
      const periodMs = period * 24 * 60 * 60 * 1000
      const currentStart = now - periodMs
      const prevStart = now - periodMs * 2

      const inWindow = (t, start, end) => { const ts = getTime(t); return ts >= start && ts < end }

      const currentTxns = transactions.filter(t => inWindow(t, currentStart, now))
      const prevTxns = transactions.filter(t => inWindow(t, prevStart, currentStart))

      const sumSales = (arr) => arr.filter(t => t.operation_type === 'sale').reduce((a, t) => a + t.amount, 0)
      const sumExpenses = (arr) => arr.filter(t => t.operation_type === 'expense').reduce((a, t) => a + t.amount, 0)

      const revenue = sumSales(currentTxns)
      const expense = sumExpenses(currentTxns)
      const netProfit = revenue - expense
      const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0

      const prevRevenue = sumSales(prevTxns)
      const prevExpense = sumExpenses(prevTxns)
      const prevNetProfit = prevRevenue - prevExpense

      const pctDelta = (curr, prev) => (prev !== 0 ? Math.round(((curr - prev) / Math.abs(prev)) * 100) : null)

      const revenueDelta = pctDelta(revenue, prevRevenue)
      const expenseDelta = pctDelta(expense, prevExpense)
      const netProfitDelta = pctDelta(netProfit, prevNetProfit)

      setSummary({ revenue, expense, netProfit, margin, revenueDelta, expenseDelta, netProfitDelta })

      // Expense breakdown by category
      const catMap = {}
      EXPENSE_CATEGORIES.forEach(c => { catMap[c.id] = 0 })
      currentTxns
        .filter(t => t.operation_type === 'expense')
        .forEach(t => {
          const cat = t.expense_category || 'other'
          catMap[cat] = (catMap[cat] || 0) + t.amount
        })
      const maxCat = Math.max(...Object.values(catMap), 1)
      const catList = EXPENSE_CATEGORIES
        .map(c => ({ ...c, amount: catMap[c.id] || 0, pct: Math.round(((catMap[c.id] || 0) / maxCat) * 100) }))
        .filter(c => c.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
      setCategories(catList)

      // Monthly profit (last 6 months)
      const monthMap = {}
      const monthLabels = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        monthMap[key] = 0
        monthLabels.push({ key, label: d.toLocaleDateString('en', { month: 'short' }) })
      }
      transactions.forEach(t => {
        const d = new Date(t.created_at || t.ts || Date.now())
        const key = `${d.getFullYear()}-${d.getMonth()}`
        if (key in monthMap) {
          if (t.operation_type === 'sale') monthMap[key] += t.amount
          if (t.operation_type === 'expense') monthMap[key] -= t.amount
        }
      })
      setMonthly(monthLabels.map(m => ({ label: m.label, profit: monthMap[m.key] })))

      // AI tip
      if (expenseDelta !== null && expenseDelta >= 15) {
        setAiTip(`You spent ${expenseDelta}% more this period.`)
      } else if (revenueDelta !== null && revenueDelta >= 15) {
        setAiTip(`Revenue grew ${revenueDelta}% — keep it up.`)
      } else if (margin >= 30) {
        setAiTip(`Your margin is strong at ${margin}%.`)
      } else {
        setAiTip('Add more data for insights.')
      }
    } catch (err) {
      console.error('Financial analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(summary.margin * 1.8 + 35)))

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 200, height: 200, top: -40, right: -40, background: 'rgba(240,169,61,0.14)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Financial Analysis" />

        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              flex: 1,
              background: period === p.id ? 'rgba(240,169,61,0.2)' : 'var(--glass-fill-soft)',
              border: period === p.id ? '1px solid rgba(240,169,61,0.5)' : '1px solid var(--glass-border)',
              borderRadius: 8, padding: '6px 4px', fontSize: 10,
              fontFamily: 'var(--font-display)', fontWeight: 600,
              color: period === p.id ? '#F0A93D' : 'var(--text-low)', cursor: 'pointer',
            }}>
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Icon name="loader" size={24} color="var(--text-low)" spin />
          </div>
        ) : (
          <>
            <GlassCard style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Financial Health</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: healthColor(score) }}>
                  {score}
                </p>
                <p style={{ fontSize: 11, color: healthColor(score), fontWeight: 600 }}>{healthLabel(score)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Profit</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#F0A93D' }}>{summary.margin}%</p>
              </div>
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, marginTop: 8 }}>
              <GlassCard style={{ marginBottom: 0 }}>
                <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Revenue</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-hi)' }}>
                  {fmtKES(summary.revenue)} KES
                </p>
                <Delta value={summary.revenueDelta} />
              </GlassCard>

              <GlassCard style={{ marginBottom: 0 }}>
                <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Expense</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-hi)' }}>
                  {fmtKES(summary.expense)} KES
                </p>
                <Delta value={summary.expenseDelta === null ? null : -summary.expenseDelta} />
              </GlassCard>

              <GlassCard style={{ marginBottom: 0 }}>
                <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Net Profit</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#5FD97A' }}>
                  {fmtKES(summary.netProfit)} KES
                </p>
                <Delta value={summary.netProfitDelta} />
              </GlassCard>

              <GlassCard style={{ marginBottom: 0 }}>
                <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Margin</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#F0A93D' }}>
                  {summary.margin}%
                </p>
              </GlassCard>
            </div>

            <SectionTitle>Top expenses</SectionTitle>
            {categories.length === 0 ? (
              <GlassCard style={{ textAlign: 'center', padding: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-low)' }}>No expenses recorded yet</p>
              </GlassCard>
            ) : categories.map((c) => (
              <GlassCard key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(240,169,61,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={c.icon} size={14} color="#F0A93D" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 5 }}>{c.label}</p>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.pct}%`, background: 'linear-gradient(90deg,#F0A93D,#FFD98A)', borderRadius: 2 }} />
                  </div>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', flexShrink: 0 }}>
                  {fmtKES(c.amount)} KES
                </p>
              </GlassCard>
            ))}

            <SectionTitle>Monthly Profit</SectionTitle>
            <GlassCard>
              <MonthlyBars data={monthly} />
            </GlassCard>

            <SectionTitle>AI Financial Insight</SectionTitle>
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(240,169,61,0.20)',
              borderRadius: 12, padding: '10px 12px',
            }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5 }}>
                {aiTip}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
