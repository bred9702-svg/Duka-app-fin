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
  { id: 7, label: '7 days' },
  { id: 30, label: '30 days' },
  { id: 90, label: '3 months' },
]

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'barChart' },
  { id: 'products', label: 'Products', icon: 'bottle' },
  { id: 'clients', label: 'Clients', icon: 'users' },
  { id: 'time', label: 'Time', icon: 'pieChart' },
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

function BarChart({ data, colorFn, labelKey, valueKey }) {
  if (!data || data.length === 0) return (
    <p style={{ fontSize: 11, color: 'var(--text-low)', textAlign: 'center', padding: '12px 0' }}>
      Not enough data yet
    </p>
  )
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginTop: 8 }}>
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
            <span style={{ fontSize: 8, color: 'var(--text-low)', textAlign: 'center', lineHeight: 1.2 }}>
              {d[labelKey]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState('overview')
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [topProducts, setTopProducts] = useState([])
  const [byDay, setByDay] = useState([])
  const [byHour, setByHour] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
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
      setTopProducts(Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 8))

      // By day
      const dayMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      dayData.forEach(t => { if (t.day_of_week !== null) dayMap[t.day_of_week] += t.amount })
      setByDay(Object.entries(dayMap).map(([day, amount]) => ({ label: fmtDay(parseInt(day)), amount })))

      // By hour
      const hourMap = {}
      for (let i = 0; i < 24; i++) hourMap[i] = 0
      hourData.forEach(t => { if (t.hour_of_day !== null) hourMap[t.hour_of_day] += t.amount })
      setByHour(
        Object.entries(hourMap)
          .map(([h, amount]) => ({ label: fmtHour(parseInt(h)), hour: parseInt(h), amount }))
          .filter(h => h.amount > 0)
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
      )

      // Top customers
      setTopCustomers(
        customers
          .map(c => {
            const spent = transactions
              .filter(t => t.customer_id === c.id && t.classified && t.direction === 'in')
              .reduce((a, t) => a + t.amount, 0)
            const visits = transactions.filter(t => t.customer_id === c.id).length
            return { ...c, spent, visits }
          })
          .filter(c => c.spent > 0 || c.total_owed > 0)
          .sort((a, b) => b.spent - a.spent)
          .slice(0, 8)
      )

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

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', position: 'relative' }}>
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

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: activeTab === tab.id ? 'rgba(240,169,61,0.18)' : 'var(--glass-fill-soft)',
              border: activeTab === tab.id ? '1px solid rgba(240,169,61,0.5)' : '1px solid var(--glass-border)',
              borderRadius: 10, padding: '7px 12px',
              fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 600,
              color: activeTab === tab.id ? '#F0A93D' : 'var(--text-low)',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <Icon name={tab.icon} size={13} color={activeTab === tab.id ? '#F0A93D' : 'var(--text-low)'} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Icon name="loader" size={24} color="var(--text-low)" spin />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Total sales', value: fmtKES(summary.totalSales) + ' KES', color: '#5FD97A' },
                    { label: 'Total profit', value: fmtKES(summary.totalProfit) + ' KES', color: '#F0A93D' },
                    { label: 'Transactions', value: summary.totalTransactions, color: '#5B9FF0' },
                    { label: 'Avg basket', value: fmtKES(summary.avgBasket) + ' KES', color: 'var(--text-hi)' },
                  ].map((s, i) => (
                    <GlassCard key={i} style={{ marginBottom: 0 }}>
                      <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>{s.label}</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</p>
                    </GlassCard>
                  ))}
                </div>
                <SectionTitle>Best day of the week</SectionTitle>
                <GlassCard>
                  <BarChart data={byDay} labelKey="label" valueKey="amount"
                    colorFn={(d) => {
                      const max = Math.max(...byDay.map(x => x.amount))
                      return d.amount === max && max > 0 ? '#F0A93D' : 'rgba(240,169,61,0.35)'
                    }}
                  />
                </GlassCard>
                <SectionTitle>Top 3 products</SectionTitle>
                {topProducts.slice(0, 3).length === 0 ? (
                  <GlassCard style={{ textAlign: 'center', padding: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-low)' }}>No sales data yet</p>
                  </GlassCard>
                ) : topProducts.slice(0, 3).map((p, i) => (
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
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <SectionTitle>Top products by volume</SectionTitle>
                {topProducts.length === 0 ? (
                  <GlassCard style={{ textAlign: 'center', padding: 24 }}>
                    <Icon name="bottle" size={28} color="var(--text-low)" style={{ display: 'block', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12, color: 'var(--text-low)' }}>No sales data yet</p>
                  </GlassCard>
                ) : topProducts.map((p, i) => {
                  const pct = (p.qty / (topProducts[0]?.qty || 1)) * 100
                  return (
                    <GlassCard key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)' }}>{p.name}</p>
                          <p style={{ fontSize: 10, color: 'var(--text-low)' }}>{p.qty} sold · {fmtKES(p.profit)} KES profit</p>
                        </div>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#F0A93D', marginLeft: 8 }}>×{p.qty}</p>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#F0A93D,#FFD98A)', borderRadius: 2 }} />
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            )}

            {activeTab === 'clients' && (
              <div>
                <SectionTitle>Top customers</SectionTitle>
                {topCustomers.length === 0 ? (
                  <GlassCard style={{ textAlign: 'center', padding: 24 }}>
                    <Icon name="users" size={28} color="var(--text-low)" style={{ display: 'block', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12, color: 'var(--text-low)' }}>No customer data yet</p>
                  </GlassCard>
                ) : topCustomers.map((c, i) => (
                  <GlassCard key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: i === 0 ? 'rgba(240,169,61,0.2)' : 'rgba(255,255,255,0.06)', border: i === 0 ? '1px solid rgba(240,169,61,0.4)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: i === 0 ? '#F0A93D' : 'var(--text-mid)', flexShrink: 0 }}>
                      {c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-low)' }}>
                        {c.visits} visit{c.visits !== 1 ? 's' : ''}
                        {c.total_owed > 0 && <span style={{ color: '#FF6B5B', marginLeft: 6 }}>· {fmtKES(c.total_owed)} owed</span>}
                      </p>
                    </div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#5FD97A', flexShrink: 0 }}>
                      {fmtKES(c.spent)} KES
                    </p>
                  </GlassCard>
                ))}
              </div>
            )}

            {activeTab === 'time' && (
              <div>
                <SectionTitle>Sales by day of week</SectionTitle>
                <GlassCard>
                  <BarChart data={byDay} labelKey="label" valueKey="amount"
                    colorFn={(d) => {
                      const max = Math.max(...byDay.map(x => x.amount))
                      return d.amount === max && max > 0 ? '#F0A93D' : 'rgba(240,169,61,0.35)'
                    }}
                  />
                  {byDay.some(d => d.amount > 0) && (() => {
                    const best = byDay.reduce((a, b) => b.amount > a.amount ? b : a, byDay[0])
                    return (
                      <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 8, textAlign: 'center' }}>
                        Best day: <span style={{ color: '#F0A93D', fontWeight: 600 }}>{best.label}</span> — {fmtKES(best.amount)} KES
                      </p>
                    )
                  })()}
                </GlassCard>
                <SectionTitle>Peak hours</SectionTitle>
                {byHour.length === 0 ? (
                  <GlassCard style={{ textAlign: 'center', padding: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-low)' }}>Not enough data yet</p>
                  </GlassCard>
                ) : byHour.map((h, i) => {
                  const pct = (h.amount / (byHour[0]?.amount || 1)) * 100
                  return (
                    <GlassCard key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: i === 0 ? '#F0A93D' : 'var(--text-hi)' }}>{h.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-low)' }}>{fmtKES(h.amount)} KES</p>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? 'linear-gradient(90deg,#F0A93D,#FFD98A)' : 'rgba(240,169,61,0.35)', borderRadius: 2 }} />
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
