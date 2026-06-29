import DebtHero from '../components/debts/DebtHero'
import SmartInsight from '../components/debts/SmartInsight'
import DebtCard from '../components/debts/DebtCard'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import { fmtKES } from '../utils/formatters'
import { fmtRelativeDay, getActiveDebtCount, getLastPaymentDate } from '../utils/debtInsights'

const AVATAR_COLORS = ['blue', 'amber', 'red', 'purple', 'green']

export default function DebtsScreen() {
  const navigate = useNavigate()
  const customers = useAppStore((s) => s.customers)
  const transactions = useAppStore((s) => s.transactions)

  // Supabase retourne total_owed (avec underscore)
  const active = [...customers]
    .filter((c) => (c.total_owed || 0) > 0)
    .sort((a, b) => b.total_owed - a.total_owed)
  const cleared = customers.filter((c) => (c.total_owed || 0) === 0)
  const total = customers.reduce((a, c) => a + (c.total_owed || 0), 0)
  const overdue = active.filter(c => (c.total_owed || 0) > 5000).length

return (
  <div
    style={{
      flex: 1,
      width: '100%',
      padding: '16px 14px 8px',
      position: 'relative',
    }}
  >
    <div
      className="bg-blob"
      style={{
        width: 130,
        height: 130,
        top: -30,
        left: -30,
        background: 'rgba(91,159,240,.15)',
      }}
    />

    <div style={{ position: 'relative', zIndex: 1 }}>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-hi)',
          marginBottom: 4,
        }}
      >
        Debts
      </h1>

      <p
        style={{
          color: 'var(--text-low)',
          fontSize: 12,
          marginBottom: 18,
        }}
      >
        Recover your money faster.
      </p>

<DebtHero
  total={total}
  customers={active.length}
  activeDebts={transactions.filter(
    t => t.is_debt && (t.remaining_amount || 0) > 0
  ).length}
/>
      <SmartInsight
  customers={customers}
  transactions={transactions}
/>

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          marginBottom: 10,
        }}
      >
        Customers
      </p>

      {customers.length === 0 && (
        <Card
          style={{
            textAlign: 'center',
            padding: 24,
          }}
        >
          <Icon
            name="users"
            size={34}
            color="var(--text-low)"
            style={{
              display: 'block',
              margin: '0 auto 10px',
            }}
          />

          <p
            style={{
              fontWeight: 600,
              marginBottom: 5,
            }}
          >
            No customers yet
          </p>

          <p
            style={{
              color: 'var(--text-low)',
              fontSize: 12,
            }}
          >
            Debts will appear here.
          </p>
        </Card>
      )}

      {active.map((customer, index) => (
        <DebtCard
          key={customer.id}
          customer={customer}
          color={AVATAR_COLORS[index % AVATAR_COLORS.length]}
          delay={index * .05}
          activeDebtCount={getActiveDebtCount(customer.id, transactions)}
          lastPaymentLabel={fmtRelativeDay(getLastPaymentDate(customer, transactions), 'Never')}
          onClick={() => navigate(`/customer/${customer.id}`)}
        />
      ))}

      {cleared.length > 0 && (
        <>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-low)',
              marginTop: 22,
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}
          >
            Paid customers
          </p>

          {cleared.map((customer, index) => (
            <DebtCard
              key={customer.id}
              customer={customer}
              color="green"
              delay={index * .03}
              activeDebtCount={getActiveDebtCount(customer.id, transactions)}
              lastPaymentLabel={fmtRelativeDay(getLastPaymentDate(customer, transactions), 'Never')}
              onClick={() => navigate(`/customer/${customer.id}`)}
            />
          ))}
        </>
      )}

    </div>
  </div>
)
}
