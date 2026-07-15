import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import StatCard from '../components/ui/StatCard'
import Icon from '../components/ui/Icon'
import ProfitRing from '../components/ProfitRing'
import TransactionRow from '../components/transactions/TransactionRow'
import ContextualMessage from '../components/ContextualMessage'
import { fmtKES, fmtDateLong } from '../utils/formatters'
import { getLowStock } from '../utils/inventoryEngine'
import { getTopProducts } from '../lib/db'

const MPESA_AMOUNTS = [500, 800, 1000, 1500, 2000, 2500]
const SHOW_MPESA_SIMULATOR = import.meta.env.DEV

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

function getRating(profit, income) {
  if (income === 0) return 0
  const margin = (profit / income) * 100
  if (margin >= 35) return 5
  if (margin >= 25) return 4
  if (margin >= 15) return 3
  if (margin >= 5) return 2
  return 1
}

function Stars({ count }) {
  return (
    <div style={{ display: 'flex', gap: 3, margin: '4px 0 8px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 14, opacity: i <= count ? 1 : 0.2 }}>★</span>
      ))}
    </div>
  )
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const products = useAppStore((s) => s.products)
  const todayStats = useAppStore((s) => s.todayStats)
  const addTransaction = useAppStore((s) => s.addTransaction)
  const businessPreferences = useAppStore((s) => s.businessPreferences)
  const session = useAppStore((s) => s.session)
  const [simulating, setSimulating] = useState(false)
  const [topProduct, setTopProduct] = useState(null)

  const { income, expenses, profit, unclassified: unclassifiedCount } = todayStats
  const marginPct = income > 0 ? (profit / income) * 100 : 0
  const totalOwed = customers.reduce((a, c) => a + (c.total_owed || 0), 0)
  const recent = transactions.slice(0, 5)
  const rating = getRating(profit, income)

  const topCustomer = customers
    .filter(c => (c.total_owed || 0) > 0)
    .sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0))[0] || null

  const lowStockResult = getLowStock(products)
  const lowStock = Array.isArray(lowStockResult) ? lowStockResult : []
  const firstLowStock = lowStock[0] || null
  const showDailyAiBrief = businessPreferences?.dailyAiBrief !== false
  const isEmployee = session?.role === 'employee'
  const contextualStats = isEmployee ? { ...todayStats, profit: 0 } : todayStats

  useEffect(() => {
    getTopProducts(7).then(data => {
      if (data && data.length > 0) {
        const map = {}
        data.forEach(t => {
          const name = t.product?.name
          if (!name) return
          if (!map[name]) map[name] = { name, qty: 0 }
          map[name].qty += t.quantity || 1
        })
        const top = Object.values(map).sort((a, b) => b.qty - a.qty)[0]
        setTopProduct(top || null)
      }
    }).catch(() => {})
  }, [])

  function simulateMpesa() {
    setSimulating(true)
    setTimeout(async () => {
      await addTransaction({
        amount: MPESA_AMOUNTS[Math.floor(Math.random() * MPESA_AMOUNTS.length)],
        source: 'mpesa',
        direction: 'in',
        classified: false,
        mpesa_sender_name: 'JAMES OTIENO',
        mpesa_sender_phone: '+254712345678',
        mpesa_reference: 'QK' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      })
      setSimulating(false)
      navigate('/inbox')
    }, 900)
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 150, height: 150, top: -40, right: -40, background: 'rgba(240,169,61,0.25)' }} />
      <div className="bg-blob" style={{ width: 120, height: 120, bottom: 200, left: -40, background: 'rgba(95,217,122,0.12)', animationDelay: '2s' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header humain */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 2 }}>
              {fmtDateLong(Date.now())}
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {getGreeting()} 
            </h1>
            {income > 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 3 }}>
                Your shop made <span style={{ color: '#5FD97A', fontWeight: 600 }}>{fmtKES(income)} KES</span> today
              </p>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 3 }}>
                No sales recorded yet today
              </p>
            )}
          </div>
          <div className="glass-card" style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="bottle" size={17} color="#F0A93D" />
          </div>
        </div>

        {/* Message contextuel */}
        {showDailyAiBrief && (
          <ContextualMessage
            stats={contextualStats}
            topProduct={topProduct}
            topCustomer={topCustomer}
            lowStock={lowStock}
          />
        )}

        {/* Profit ring */}
        {!isEmployee && (
          <div style={{ marginBottom: 6 }}>
            <ProfitRing profit={profit} income={income} marginPct={marginPct} />
          </div>
        )}

        {/* Stars rating */}
        {!isEmployee && income > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 4 }}>
            <Stars count={rating} />
            <p style={{ fontSize: 11, color: 'var(--text-low)' }}>
              {rating >= 4 ? 'Excellent day' : rating >= 3 ? 'Good performance' : rating >= 2 ? 'Could be better' : 'Keep going'}
            </p>
          </div>
        )}

        {/* Stat cards — langage humain */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <StatCard
            label="Money in"
            value={fmtKES(income)}
            sub={`${transactions.filter(t => t.classified && t.operation_type === 'sale').length} sales`}
            color="green"
            delay={0.05}
          />

          <StatCard
            label="Money out"
            value={fmtKES(expenses)}
            sub={`${transactions.filter(t => t.classified && t.operation_type === 'expense').length} expenses`}
            color="red"
            delay={0.1}
          />

          <StatCard
            label="Customer debt"
            value={fmtKES(totalOwed)}
            sub={`${customers.filter(c => (c.total_owed || 0) > 0).length} customers`}
            color="amber"
            delay={0.15}
          />

          <StatCard
            label="Needs review"
            value={unclassifiedCount}
            sub={unclassifiedCount ? 'Tap to classify' : 'All clear'}
            color={unclassifiedCount ? 'red' : 'green'}
            delay={0.2}
          />
        </div>

        {/* Quick insights */}
        {(topProduct || topCustomer || firstLowStock) && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick insights
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: topProduct && topCustomer ? '1fr 1fr' : '1fr', gap: 8 }}>
              {topProduct && (
                <div style={{ background: 'var(--glass-fill-soft)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '10px 12px' }}>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>BEST PRODUCT</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topProduct.name}</p>
                  <p style={{ fontSize: 10, color: '#F0A93D' }}>×{topProduct.qty} sold</p>
                </div>
              )}
              {topCustomer && (
                <div style={{ background: 'var(--glass-fill-soft)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '10px 12px' }}>
                  <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>TOP CUSTOMER</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topCustomer.name}</p>
                  <p style={{ fontSize: 10, color: '#5B9FF0' }}>{topCustomer.visit_count || 0} visits</p>
                </div>
              )}
              {firstLowStock && (
                <div style={{ background: 'rgba(255,107,91,0.08)', border: '1px solid rgba(255,107,91,0.25)', borderRadius: 12, padding: '10px 12px', gridColumn: topProduct && topCustomer ? '1 / -1' : 'auto' }}>
                  <p style={{ fontSize: 9, color: '#FF6B5B', marginBottom: 3, fontWeight: 600 }}>⚠ STOCK RUNNING LOW</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{firstLowStock.name || 'Unknown product'}</p>
                  <p style={{ fontSize: 10, color: '#FF6B5B' }}>{firstLowStock.stock_current ?? 0} units left</p>
                </div>
              )}
            </div>
          </div>
        )}

        {SHOW_MPESA_SIMULATOR && (
          <>
            {/* Development-only M-Pesa simulator */}
            <button
              onClick={simulateMpesa}
              disabled={simulating}
              style={{
                width: '100%',
                background: simulating ? 'rgba(240,169,61,0.15)' : 'linear-gradient(135deg, #FFC56B 0%, #F0A93D 100%)',
                color: simulating ? '#FFD98A' : '#2A1A05',
                border: simulating ? '1px solid rgba(240,169,61,0.3)' : '1px solid rgba(255,255,255,0.4)',
                borderRadius: 12,
                padding: 11,
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: simulating ? 'none' : '0 8px 24px -6px rgba(240,169,61,0.5)',
              }}
            >
              <Icon name={simulating ? 'loader' : 'phone'} size={15} spin={simulating} />
              {simulating ? 'Simulating M-Pesa...' : 'Simulate M-Pesa payment'}
            </button>
          </>
        )}

        {/* Recent transactions */}
        {recent.length > 0 && (
          <>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Recent transactions
            </p>
            {recent.map((t, i) => (
              <TransactionRow
                key={t.id}
                txn={t}
                customers={customers}
                delay={0.25 + i * 0.05}
                onClick={!t.classified ? () => navigate(`/classify/${t.id}`) : undefined}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
