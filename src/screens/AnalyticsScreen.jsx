import { useState, useEffect } from 'react'
import Icon from '../components/ui/Icon'
import { fmtKES } from '../utils/formatters'
import { getTopProducts, getSalesByDay, getSalesByHour, getCustomers, getTransactions } from '../lib/db'

function fmtDay(i) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i] || ''
}
function fmtHour(h) {
  if (h === 0) return '12am'
  if (h < 12) return h + 'am'
  if (h === 12) return '12pm'
  return (h - 12) + 'pm'
}

const PERIODS = [
  { id: 1, label: 'Today' },
  { id: 7, label: 'Week' },
  { id: 30, label: 'Month' },
]

function compareLabel(period) {
  if (period === 1) return 'vs yesterday'
  if (period === 7) return 'vs last week'
  return 'vs last month'
}

function SectionTitle({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-display)',
      fontSize: 10, fontWeight: 600,
      color: 'var(--text-low)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 10,
    }}>
      {children}
    </p>
  )
}

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--glass-fill-soft)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid var(--glass-border)',
      borderRadius: 14,
      padding: '12px 14px',
      marginBottom: 8,
      ...style,
    }}>
      {children}
    </div>
  )
}

function Delta({ value, label }) {
  if (value === null || value === undefined) return null
  const up = value >= 0
  const color = up ? '#5FD97A' : '#FF6B5B'
  return (
    <p style={{ fontSize: 9, fontWeight: 600, color, marginTop: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      <span>{up ? '↑' : '↓'}</span>
      <span>{Math.abs(value)}% {label}</span>
    </p>
  )
}

function AreaChart({ data, color = '#F0A93D' }) {
  const hasData = data && data.some(d => d.amount > 0)

  if (!hasData) {
    return (
      <p style={{ fontSize: 11, color: 'var(--text-low)', textAlign: 'center', padding: '34px 0' }}>
        Not enough data yet
      </p>
    )
  }

  const W = 300
  const H = 92
  const padX = 6
  const padY = 12
  const max = Math.max(...data.map(d => d.amount), 1)
  const stepX = (W - padX * 2) / (data.length - 1)

  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + (H - padY * 2) * (1 - d.amount / max),
    ...d,
  }))

  let linePath = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const midX = (p0.x + p1.x) / 2
    linePath += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`
  }

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`
  const maxIdx = points.reduce((best, p, i) => (p.amount > points[best].amount ? i : best), 0)

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 108, overflow: 'visible', display: 'block' }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.38" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#revenueFill)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === maxIdx ? 3.5 : 2.2}
            fill={i === maxIdx ? color : 'var(--bg-deep)'}
            stroke={color}
            strokeWidth={i === maxIdx ? 0 : 1.4}
          />
        ))}
      </svg>

      <div style={{ display: 'flex', marginTop: 4 }}>
        {points.map((p, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 8,
              color: i === maxIdx ? color : 'var(--text-low)',
              fontWeight: i === maxIdx ? 700 : 400,
            }}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function MiniBars({ data, color = '#F0A93D' }) {
  if (!data || data.every(d => d.amount === 0)) {
    return (
      <p style={{ fontSize: 11, color: 'var(--text-low)', textAlign: 'center', padding: '20px 0' }}>
        Not enough data yet
      </p>
    )
  }
  const max = Math.max(...data.map(d => d.amount), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60, marginTop: 4 }}>
      {data.map((d, i) => {
        const pct = (d.amount / max) * 100
        const isMax = d.amount === max
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${Math.max(pct, 4)}%`,
              background: isMax ? color : `${color}55`,
              borderRadius: '4px 4px 0 0',
            }} />
            <span style={{ fontSize: 7, color: isMax ? color : 'var(--text-low)', fontWeight: isMax ? 700 : 400 }}>
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState(7)
  const [loading, setLoading] = useState(true)
  const [topProducts, setTopProducts] = useState([])
  const [byDay, setByDay] = useState([])
  const [byHourChart, setByHourChart] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [customerCount, setCustomerCount] = useState(0)
  const [summary, setSummary] = useState({
    totalSales: 0, totalProfit: 0, totalTransactions: 0, avgBasket: 0,
    salesDelta: null, profitDelta: null, ordersDelta: null, basketDelta: null,
  })
  const [aiTip, setAiTip] = useState('Add more sales data for insights.')

  useEffect(() => { loadData() }, [period])

  async function loadData() {
    setLoading(true)
    try {
      const [products, dayData, hourData, customers, transactions] = await Promise.all([
        getTopProducts(period),
        getSalesByDay(),
        getSalesByHour(),
        getCustomers(),
        getTransactions(200),
      ])

      // Top products (with relative dominance for progress bar)
      const productMap = {}
      products.forEach(t => {
        const name = t.product?.name || 'Unknown'
        if (!productMap[name]) productMap[name] = { name, qty: 0, profit: 0 }
        productMap[name].qty += t.quantity || 1
        productMap[name].profit += t.profit || 0
      })
      const top3 = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 3)
      const topQty = top3[0]?.qty || 1
      setTopProducts(top3.map(p => ({ ...p, pct: Math.round((p.qty / topQty) * 100) })))

      // By day (revenue trend)
      const dayMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      dayData.forEach(t => { if (t.day_of_week !== null) dayMap[t.day_of_week] += t.amount })
      setByDay(Object.entries(dayMap).map(([day, amount]) => ({ label: fmtDay(parseInt(day)), amount })))

      // By hour (sampled, for Sale by Hour chart)
      const hourMap = {}
      for (let i = 0; i < 24; i++) hourMap[i] = 0
      hourData.forEach(t => { if (t.hour_of_day !== null) hourMap[t.hour_of_day] += t.amount })
      setByHourChart(
        [6, 9, 12, 15, 18, 21].map(h => ({ label: fmtHour(h), amount: hourMap[h] || 0 }))
      )

      // Top customers
      const customersWithSpend = customers
        .map(c => {
          const spent = transactions
            .filter(t => t.customer_id === c.id && t.classified && t.direction === 'in')
            .reduce((a, t) => a + t.amount, 0)
          const visits = transactions.filter(t => t.customer_id === c.id).length
          return { ...c, spent, visits }
        })
        .filter(c => c.spent > 0 || c.total_owed > 0)
        .sort((a, b) => b.spent - a.spent)

      setTopCustomers(customersWithSpend.slice(0, 3))
      setCustomerCount(customers.length)

      // Summary + period-over-period deltas
      const getTime = (t) => new Date(t.created_at || t.ts || Date.now()).getTime()
      const now = Date.now()
      const periodMs = period * 24 * 60 * 60 * 1000
      const currentStart = now - periodMs
      const prevStart = now - periodMs * 2

      const allSales = transactions.filter(t => t.operation_type === 'sale')
      const currentSales = allSales.filter(t => getTime(t) >= currentStart)
      const prevSales = allSales.filter(t => getTime(t) >= prevStart && getTime(t) < currentStart)

      const totalSales = currentSales.reduce((a, t) => a + t.amount, 0)
      const totalProfit = currentSales.reduce((a, t) => a + (t.profit || 0), 0)
      const totalTransactions = currentSales.length
      const avgBasket = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0

      const prevSalesTotal = prevSales.reduce((a, t) => a + t.amount, 0)
      const prevProfitTotal = prevSales.reduce((a, t) => a + (t.profit || 0), 0)
      const prevOrders = prevSales.length
      const prevBasket = prevOrders > 0 ? Math.round(prevSalesTotal / prevOrders) : 0

      const pctDelta = (curr, prev) =>
        prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null

      const salesDelta = pctDelta(totalSales, prevSalesTotal)
      const profitDelta = pctDelta(totalProfit, prevProfitTotal)
      const ordersDelta = pctDelta(totalTransactions, prevOrders)
      const basketDelta = pctDelta(avgBasket, prevBasket)

      setSummary({ totalSales, totalProfit, totalTransactions, avgBasket, salesDelta, profitDelta, ordersDelta, basketDelta })

      // AI Business — a more natural, data-driven line
      if (salesDelta !== null && salesDelta >= 15) {
        setAiTip(`Revenue is up ${salesDelta}% ${compareLabel(period)}.`)
      } else if (salesDelta !== null && salesDelta <= -15) {
        setAiTip(`Revenue dipped ${Math.abs(salesDelta)}% ${compareLabel(period)}.`)
      } else if (top3[0]) {
        setAiTip(`${top3[0].name} is your top mover this period.`)
      } else if (profitDelta !== null && profitDelta >= 0) {
        setAiTip(`Profit margin is healthy ${compareLabel(period)}.`)
      } else {
        setAiTip('Add more sales data for insights.')
      }
    } catch (err) {
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const topCustomer = topCustomers[0]
  const cmpLabel = compareLabel(period)

  return (<div style={{ flex: 1, padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 220, height: 220, top: -40, left: -40, background: 'rgba(240,169,61,0.14)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em' }}>
            Analytics
          </h1>
          <div style={{ display: 'flex', gap: 4 }}>
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)} style={{
                background: period === p.id ? 'rgba(240,169,61,0.2)' : 'var(--glass-fill-soft)',
                border: period === p.id ? '1px solid rgba(240,169,61,0.5)' : '1px solid var(--glass-border)',
                borderRadius: 8, padding: '4px 8px', fontSize: 10,
                fontFamily: 'var(--font-display)', fontWeight: 600,
                color: period === p.id ? '#F0A93D' : 'var(--text-low)', cursor: 'pointer',
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Icon name="loader" size={24} color="var(--text-low)" spin />
          </div>
        ) : (
          <>
            <SectionTitle>Revenue Trend</SectionTitle>
            <GlassCard style={{ padding: '14px 14px 10px' }}>
              <AreaChart data={byDay} color="#F0A93D" />
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Revenue', value: fmtKES(summary.totalSales) + ' KES', color: '#5FD97A', delta: summary.salesDelta },
                { label: 'Profit', value: fmtKES(summary.totalProfit) + ' KES', color: '#F0A93D', delta: summary.profitDelta },
                { label: 'Orders', value: summary.totalTransactions, color: '#5B9FF0', delta: summary.ordersDelta },
                { label: 'Avg Basket', value: fmtKES(summary.avgBasket) + ' KES', color: 'var(--text-hi)', delta: summary.basketDelta },
              ].map((s, i) => (
                <GlassCard key={i} style={{ marginBottom: 0 }}>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>{s.label}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</p>
                  <Delta value={s.delta} label={cmpLabel} />
                </GlassCard>
              ))}
            </div>

            <SectionTitle>Top 3 products</SectionTitle>
            {topProducts.length === 0 ? (
              <GlassCard style={{ textAlign: 'center', padding: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-low)' }}>No sales data yet</p>
              </GlassCard>
            ) : topProducts.map((p, i) => (
              <GlassCard key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? 'rgba(240,169,61,0.2)' : 'var(--glass-fill-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: i === 0 ? '#F0A93D' : 'var(--text-low)', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)' }}>{p.name}</p>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', margin: '5px 0' }}>
                    <div style={{ height: '100%', width: `${p.pct}%`, background: i === 0 ? 'linear-gradient(90deg,#F0A93D,#FFD98A)' : 'rgba(240,169,61,0.4)', borderRadius: 2 }} />
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.qty} sold</p>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#5FD97A', flexShrink: 0 }}>
                  +{fmtKES(p.profit)} KES
                </p>
              </GlassCard>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6, marginBottom: 8 }}>
              <GlassCard style={{ marginBottom: 0 }}>
                <Icon name="users" size={16} color="#5B9FF0" style={{ marginBottom: 6 }} />
                <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Customer Ins.</p>
                {topCustomer ? (
                  <>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {topCustomer.name}
                    </p>
                    <p style={{ fontSize: 9, color: '#5FD97A', marginTop: 2 }}>
                      {fmtKES(topCustomer.spent)} KES top
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: 11, color: 'var(--text-low)' }}>{customerCount} customers</p>
                )}
              </GlassCard>

              <GlassCard style={{ marginBottom: 0 }}>
                <Icon name="bell" size={16} color="#FF6B5B" style={{ marginBottom: 6 }} />
                <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>AI Business</p>
                <p style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.4 }}>
                  {aiTip}
                </p>
              </GlassCard>
            </div>

            <SectionTitle>Sale by Hour</SectionTitle>
            <GlassCard>
              <MiniBars data={byHourChart} color="#F0A93D" />
            </GlassCard>
          </>
        )}
      </div>
    </div>
  )
}
