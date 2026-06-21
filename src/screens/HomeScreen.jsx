import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import StatCard from '../components/ui/StatCard'
import Icon from '../components/ui/Icon'
import ProfitRing from '../components/ProfitRing'
import TransactionRow from '../components/transactions/TransactionRow'
import { fmtDateLong, newId } from '../utils/formatters'

const MPESA_AMOUNTS = [500, 800, 1000, 1500, 2000, 2500]

export default function HomeScreen() {
  const navigate = useNavigate()
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const addTransaction = useAppStore((s) => s.addTransaction)
  const [simulating, setSimulating] = useState(false)

  const today = transactions.filter((t) => Date.now() - t.ts < 86400000)
  const income = today
    .filter(
      (t) =>
        t.direction === 'in' &&
        t.classified &&
        t.classification?.type !== 'debt'
    )
    .reduce((a, t) => a + t.amount, 0)
  const expenses = today
    .filter((t) => t.direction === 'out' && t.classified)
    .reduce((a, t) => a + t.amount, 0)
  const profit = income - expenses
  const marginPct = income > 0 ? (profit / income) * 100 : 0
  const totalOwed = customers.reduce((a, c) => a + c.totalOwed, 0)
  const unclassified = transactions.filter((t) => !t.classified)
  const recent = transactions.slice(0, 5)

  function simulateMpesa() {
    setSimulating(true)
    setTimeout(() => {
      addTransaction({
        id: newId('t'),
        amount: MPESA_AMOUNTS[Math.floor(Math.random() * MPESA_AMOUNTS.length)],
        source: 'mpesa',
        direction: 'in',
        ts: Date.now(),
        classified: false,
        classification: null,
      })
      setSimulating(false)
      navigate('/inbox')
    }, 900)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 150, height: 150, top: -40, right: -40, background: 'rgba(240,169,61,0.25)' }}
      />
      <div
        className="bg-blob"
        style={{ width: 120, height: 120, bottom: 200, left: -40, background: 'rgba(95,217,122,0.12)', animationDelay: '2s' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <div>
            <p style={{ fontSize: 9, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              {fmtDateLong(Date.now())}
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 21,
                fontWeight: 700,
                color: 'var(--text-hi)',
                letterSpacing: '-0.02em',
                marginTop: 2,
              }}
            >
              Today's overview
            </h1>
          </div>
          <div
            className="glass-card"
            style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="bottle" size={17} color="#F0A93D" />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <ProfitRing profit={profit} income={income} marginPct={marginPct} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <StatCard
            label="Income"
            value={income.toLocaleString()}
            sub={`${today.filter((t) => t.classified && t.direction === 'in').length} transactions`}
            color="green"
            delay={0.05}
          />
          <StatCard
            label="Expenses"
            value={expenses.toLocaleString()}
            sub={`${today.filter((t) => t.classified && t.direction === 'out').length} items`}
            color="red"
            delay={0.1}
          />
          <StatCard
            label="Debts owed"
            value={totalOwed.toLocaleString()}
            sub={`${customers.filter((c) => c.totalOwed > 0).length} customers`}
            color="amber"
            delay={0.15}
          />
          <StatCard
            label="Unclassified"
            value={unclassified.length}
            sub={unclassified.length ? 'Needs review →' : 'All clear'}
            color={unclassified.length ? 'red' : 'green'}
            delay={0.2}
          />
        </div>

        <button
          onClick={simulateMpesa}
          disabled={simulating}
          style={{
            width: '100%',
            background: simulating
              ? 'rgba(240,169,61,0.15)'
              : 'linear-gradient(135deg, #FFC56B 0%, #F0A93D 100%)',
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

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-low)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
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
      </div>
    </div>
  )
}
