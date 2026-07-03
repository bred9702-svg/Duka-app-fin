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

function BarChart({ data, colorFn, labelKey, valueKey, height = 80 }) {
  if (!data || data.length === 0) return (
    <p style={{ fontSize: 11, color: 'var(--text-low)', textAlign: 'center', padding: '12px 0' }}>
      Not enough data yet
    </p>
  )
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, marginTop: 8 }}>
      {data.map((d, i) => {
        const pct = ((d[valueKey] || 0) / max) * 100
        const color = colorFn ? colorFn(d, i) : '#F0A93D'
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${Math.max(pct, 4)}%`,
              background: color,
              borderRadius: '4px 4px 0 0',
              boxShadow: `0 0 8px ${color}55`,
            }} />
            <span style={{ fontSize: 7, color: 'var(--text-low)', textAlign: 'center', lineHeight: 1.2 }}>
              {d[labelKey]}
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
  const [summary, setSummary] = useState({ totalSales: 0, totalProfit: 0, totalTransactions: 0, avgBasket: 0 })

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

      // Top products
      const productMap = {}
      products.forEach(t => {
        const name = t.product?.name || 'Unknown'
        if (!productMap[name]) productMap[name] = { name, qty: 0, profit: 0 }
        productMap[name].qty += t.quantity || 1
        productMap[name].profit += t.profit || 0
      })
      setTopProducts(Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 3))

      // By day (revenue trend)
      const dayMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      dayData.forEach(t => { if (t.day_of_week !== null) dayMap[t.day_of_week] += t.amount })
      setByDay(Object.entries(dayMap).map(([day, amount]) => ({ label: fmtDay(parseInt(day)), amount })))

      // By hour (full 24h, ordered, for Sale by Hour chart)
      const hourMap = {}
      for (let i = 0; i < 24; i++) hourMap[i] = 0
      hourData.forEach(t => { if (t.hour_of_day !== null) hourMap[t.hour_of_day] += t.amount })
      setByHourChart(
        [6, 9, 12, 15, 18, 21].map(h => ({
          label: fmtHour(h),
          amount: hourMap[h] || 0,
        }))
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

      // Summary
      const sales = transactions.filter(t => t.operation_type === 'sale')
      const totalSales = sales.reduce((a, t) => a + t.amount, 0)
      const totalProfit = sales.reduce((a, t) => a + (t.profit || 0), 0)
      setSummary({
        totalSales,
        totalProfit,
        totalTransactions: sales.length,
        avgBasket: sales.length > 0 ? Math.round(totalSales / sales.length) : 0,
      })
    } catch (err) {
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const topCustomer = topCustomers[0]

  return (<div style={{ flex: 1, padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -30, background: 'rgba(240,169,61,0.2)' }} />
      <div className="bg-blob" style={{ width: 110, height: 110, bottom: 100, left: -30, background: 'rgba(91,159,240,0.15)', animationDelay: '3s' }} />

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
            <GlassCard>
              <BarChart data={byDay} labelKey="label" valueKey="amount"
                colorFn={(d) => {
                  const max = Math.max(...byDay.map(x => x.amount))
                  return d.amount === max && max > 0 ? '#F0A93D' : 'rgba(240,169,61,0.35)'
                }}
              />
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Revenue', value: fmtKES(summary.totalSales) + ' KES', color: '#5FD97A' },
                { label: 'Profit', value: fmtKES(summary.totalProfit) + ' KES', color: '#F0A93D' },
                { label: 'Orders', value: summary.totalTransactions, color: '#5B9FF0' },
                { label: 'Avg Basket', value: fmtKES(summary.avgBasket) + ' KES', color: 'var(--text-hi)' },
              ].map((s, i) => (
                <GlassCard key={i} style={{ marginBottom: 0 }}>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>{s.label}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</p>
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
                <div style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? 'rgba(240,169,61,0.2)' : 'var(--glass-fill-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: i === 0 ? '#F0A93D' : 'var(--text-low)' }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)' }}>{p.name}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.qty} sold</p>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#5FD97A' }}>
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
                  {summary.totalProfit > 0
                    ? `Profit margin looking healthy this period.`
                    : `Add more sales data for insights.`}
                </p>
              </GlassCard>
            </div>

            <SectionTitle>Sale by Hour</SectionTitle>
            <GlassCard>
              <BarChart data={byHourChart} labelKey="label" valueKey="amount" height={70}
                colorFn={(d) => {
                  const max = Math.max(...byHourChart.map(x => x.amount))
                  return d.amount === max && max > 0 ? '#F0A93D' : 'rgba(240,169,61,0.35)'
                }}
              />
            </GlassCard>
          </>
        )}
      </div>
    </div>
  )
}
