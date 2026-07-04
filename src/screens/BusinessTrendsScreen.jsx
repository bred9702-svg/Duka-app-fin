import { useState, useEffect } from 'react'
import Icon from '../components/ui/Icon'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import { getTransactions, getCustomers } from '../lib/db'

const PERIODS = [
  { id: 1, label: 'Today' },
  { id: 7, label: 'Week' },
  { id: 30, label: 'Month' },
  { id: 365, label: 'Year' },
]

function compareLabel(period) {
  if (period === 1) return 'vs yesterday'
  if (period === 7) return 'vs last week'
  if (period === 30) return 'vs last month'
  return 'vs last year'
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

function PeakCurve({ data }) {
  const hasData = data && data.some(d => d.amount > 0)
  if (!hasData) {
    return <p style={{ fontSize: 11, color: 'var(--text-low)', textAlign: 'center', padding: '30px 0' }}>Not enough data yet</p>
  }
  const W = 300, H = 80, padX = 6, padY = 8
  const max = Math.max(...data.map(d => d.amount), 1)
  const stepX = (W - padX * 2) / (data.length - 1)
  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + (H - padY * 2) * (1 - d.amount / max),
    ...d,
  }))
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1]
    const midX = (p0.x + p1.x) / 2
    path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`
  }
  const areaPath = `${path} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`
  const maxIdx = points.reduce((best, p, i) => (p.amount > points[best].amount ? i : best), 0)

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 90, overflow: 'visible', display: 'block' }}>
        <defs>
          <linearGradient id="peakFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0A93D" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F0A93D" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#peakFill)" />
        <path d={path} fill="none" stroke="#F0A93D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === maxIdx ? 3.5 : 2} fill={i === maxIdx ? '#F0A93D' : 'var(--bg-deep)'} stroke="#F0A93D" strokeWidth={i === maxIdx ? 0 : 1.4} />
        ))}
      </svg>
      <div style={{ display: 'flex', marginTop: 4 }}>
        {points.map((p, i) => (
          <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: i === maxIdx ? '#F0A93D' : 'var(--text-low)', fontWeight: i === maxIdx ? 700 : 400 }}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function TrendRow({ rank, name, pct, up }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0' }}>
      <span style={{ fontSize: 10, color: 'var(--text-low)', width: 12 }}>{rank}</span>
      <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: up ? '#5FD97A' : '#FF6B5B', display: 'flex', alignItems: 'center', gap: 2 }}>
        {up ? '↑' : '↓'} {pct}%
      </span>
    </div>
  )
}

export default function BusinessTrendsScreen() {
  const [period, setPeriod] = useState(7)
  const [loading, setLoading] = useState(true)
  const [momentum, setMomentum] = useState({ growing: true, pct: 0 })
  const [trendingUp, setTrendingUp] = useState([])
  const [trendingDown, setTrendingDown] = useState([])
  const [peakByDay, setPeakByDay] = useState([])
  const [newCustomers, setNewCustomers] = useState(0)
  const [returningRate, setReturningRate] = useState(0)
  const [summary, setSummary] = useState('Add more sales data for trend insights.')

  useEffect(() => { loadData() }, [period])

  async function loadData() {
    setLoading(true)
    try {
      const [transactions, customers] = await Promise.all([
        getTransactions(500),
        getCustomers(),
      ])

      const getTime = (t) => new Date(t.created_at || t.ts || Date.now()).getTime()
      const now = Date.now()
      const periodMs = period * 24 * 60 * 60 * 1000
      const currentStart = now - periodMs
      const prevStart = now - periodMs * 2

      const inWindow = (t, start, end) => { const ts = getTime(t); return ts >= start && ts < end }
      const currentSales = transactions.filter(t => t.operation_type === 'sale' && inWindow(t, currentStart, now))
      const prevSales = transactions.filter(t => t.operation_type === 'sale' && inWindow(t, prevStart, currentStart))

      // Business momentum
      const currentTotal = currentSales.reduce((a, t) => a + t.amount, 0)
      const prevTotal = prevSales.reduce((a, t) => a + t.amount, 0)
      const momentumPct = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : 0
      setMomentum({ growing: momentumPct >= 0, pct: momentumPct })

      // Per-product qty comparison
      const qtyByProduct = (arr) => {
        const map = {}
        arr.forEach(t => {
          const name = t.product?.name || 'Unknown'
          map[name] = (map[name] || 0) + (t.quantity || 1)
        })
        return map
      }
      const currentQty = qtyByProduct(currentSales)
      const prevQty = qtyByProduct(prevSales)
      const allNames = new Set([...Object.keys(currentQty), ...Object.keys(prevQty)])

      const deltas = [...allNames].map(name => {
        const curr = currentQty[name] || 0
        const prev = prevQty[name] || 0
        const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : (curr > 0 ? 100 : 0)
        return { name, pct, curr, prev }
      }).filter(d => d.curr > 0 || d.prev > 0)

      setTrendingUp(deltas.filter(d => d.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 3))
      setTrendingDown(deltas.filter(d => d.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, 3))

      // Peak selling by day of week
      const dayMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      currentSales.forEach(t => { if (t.day_of_week !== null && t.day_of_week !== undefined) dayMap[t.day_of_week] += t.amount })
      const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
      setPeakByDay(Object.entries(dayMap).map(([d, amount]) => ({ label: dayLabels[parseInt(d)], amount })))

      // Customer trends
      const currentCustomerIds = new Set(currentSales.map(t => t.customer_id).filter(Boolean))
      const prevCustomerIds = new Set(prevSales.map(t => t.customer_id).filter(Boolean))
      const returning = [...currentCustomerIds].filter(id => prevCustomerIds.has(id)).length
      const newOnes = [...currentCustomerIds].filter(id => !prevCustomerIds.has(id)).length
      setNewCustomers(newOnes)
      setReturningRate(currentCustomerIds.size > 0 ? Math.round((returning / currentCustomerIds.size) * 100) : 0)

      // Summary
      const weekendSales = currentSales.filter(t => t.day_of_week === 0 || t.day_of_week === 6).reduce((a, t) => a + t.amount, 0)
      const weekdaySales = currentTotal - weekendSales
      if (weekendSales > weekdaySales && currentTotal > 0) {
        setSummary('Weekend sales increased compared to weekdays this period.')
      } else if (deltas.filter(d => d.pct > 0)[0]) {
        setSummary(`${deltas.filter(d => d.pct > 0).sort((a, b) => b.pct - a.pct)[0].name} is gaining momentum.`)
      } else if (currentTotal > 0) {
        setSummary('Business activity is steady this period.')
      } else {
        setSummary('Add more sales data for trend insights.')
      }
    } catch (err) {
      console.error('Business trends error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 200, height: 200, top: -40, right: -40, background: 'rgba(124,92,252,0.14)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Business Trends" />

        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              flex: 1,
              background: period === p.id ? 'rgba(124,92,252,0.2)' : 'var(--glass-fill-soft)',
              border: period === p.id ? '1px solid rgba(124,92,252,0.5)' : '1px solid var(--glass-border)',
              borderRadius: 8, padding: '6px 4px', fontSize: 10,
              fontFamily: 'var(--font-display)', fontWeight: 600,
              color: period === p.id ? '#B9A6FF' : 'var(--text-low)', cursor: 'pointer',
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
            <GlassCard>
              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 4, fontWeight: 500 }}>Business Momentum</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: momentum.growing ? '#5FD97A' : '#FF6B5B' }}>
                {momentum.growing ? 'Growing' : 'Slowing'}
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, color: momentum.growing ? '#5FD97A' : '#FF6B5B', marginTop: 3 }}>
                {momentum.growing ? '↑' : '↓'} {Math.abs(momentum.pct)}% {compareLabel(period)}
              </p>
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <GlassCard style={{ marginBottom: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', marginBottom: 4 }}>Trending Up</p>
                {trendingUp.length === 0 ? (
                  <p style={{ fontSize: 10, color: 'var(--text-low)' }}>No data</p>
                ) : trendingUp.map((d, i) => (
                  <TrendRow key={d.name} rank={i + 1} name={d.name} pct={d.pct} up />
                ))}
              </GlassCard>

              <GlassCard style={{ marginBottom: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-low)', marginBottom: 4 }}>Trending Down</p>
                {trendingDown.length === 0 ? (
                  <p style={{ fontSize: 10, color: 'var(--text-low)' }}>No data</p>
                ) : trendingDown.map((d, i) => (
                  <TrendRow key={d.name} rank={i + 1} name={d.name} pct={Math.abs(d.pct)} up={false} />
                ))}
              </GlassCard>
            </div>

            <SectionTitle>Peak Selling Days</SectionTitle>
            <GlassCard>
              <PeakCurve data={peakByDay} />
            </GlassCard>

            <SectionTitle>Customer Trends</SectionTitle>
            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(91,159,240,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="users" size={14} color="#5B9FF0" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>New customers</p>
                <p style={{ fontSize: 10, color: 'var(--text-low)' }}>This period</p>
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#5FD97A' }}>{newCustomers}</p>
            </GlassCard>

            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(240,169,61,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="userDollar" size={14} color="#F0A93D" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>Returning rate</p>
                <p style={{ fontSize: 10, color: 'var(--text-low)' }}>Customers who came back</p>
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#F0A93D' }}>{returningRate}%</p>
            </GlassCard>

            <SectionTitle>Trend Summary</SectionTitle>
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,92,252,0.20)',
              borderRadius: 12, padding: '10px 12px',
            }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5 }}>
                {summary}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
