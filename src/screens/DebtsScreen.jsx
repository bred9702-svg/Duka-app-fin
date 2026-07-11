import { useState } from 'react'
import DebtHero from '../components/debts/DebtHero'
import SmartInsight from '../components/debts/SmartInsight'
import DebtCard from '../components/debts/DebtCard'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'

const AVATAR_COLORS = ['blue', 'amber', 'red', 'purple', 'green']
const PAGE_SIZE = 10

export default function DebtsScreen() {
  const navigate = useNavigate()
  const customers = useAppStore((s) => s.customers)

  const [activeTab, setActiveTab] = useState('active')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Supabase retourne total_owed (avec underscore)
  const activeDebts = [...customers]
    .filter((c) => (c.total_owed || 0) > 0)
    .sort((a, b) => b.total_owed - a.total_owed)
  const cleared = customers.filter((c) => (c.total_owed || 0) === 0)
  const total = customers.reduce((a, c) => a + (c.total_owed || 0), 0)
  const overdue = activeDebts.filter(c => (c.total_owed || 0) > 5000).length

  function matchesSearch(c) {
    return [c.name, c.phone, c.mpesa_name]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(search.toLowerCase()))
  }

  const filteredActive = activeDebts.filter(matchesSearch)
  const filteredCleared = cleared.filter(matchesSearch)
  const currentList = activeTab === 'active' ? filteredActive : filteredCleared
  const visibleList = currentList.slice(0, visibleCount)

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
  customers={activeDebts.length}
  overdue={overdue}
/>
      <button
        onClick={() => navigate('/new-debt')}
        style={{
          width: '100%',
          border: '1px solid rgba(240,169,61,.35)',
          borderRadius: 12,
          padding: '10px 12px',
          marginBottom: 14,
          background: 'rgba(240,169,61,.14)',
          color: '#F0A93D',
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        + New Debt
      </button>

      <SmartInsight customers={customers} />

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

      {customers.length > 0 && (
        <>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
              placeholder="Search customer..."
              style={{
                width: '100%',
                border: '1px solid var(--glass-border)',
                borderRadius: 10,
                padding: '10px 12px 10px 34px',
                fontSize: 13,
                background: 'var(--glass-fill-soft)',
                color: 'var(--text-hi)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              }}
            />
            <Icon name="search" size={15} color="var(--text-low)" style={{ position: 'absolute', left: 11, top: 12 }} />
          </div>

          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--glass-border)',
              marginBottom: 14,
            }}
          >
            {[
              { id: 'active', label: 'Active Debts', color: '#5B9FF0' },
              { id: 'paid', label: 'Paid Customers', color: '#5FD97A' },
            ].map((tab) => {
              const selected = activeTab === tab.id
              return (
                <div
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setVisibleCount(PAGE_SIZE) }}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px 4px',
                    cursor: 'pointer',
                    borderBottom: selected ? `2px solid ${tab.color}` : '2px solid transparent',
                    marginBottom: -1,
                    transition: 'all .2s ease',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 12,
                      fontWeight: selected ? 700 : 500,
                      color: selected ? tab.color : 'var(--text-low)',
                    }}
                  >
                    {tab.label}
                  </span>
                </div>
              )
            })}
          </div>

          {currentList.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 20 }}>
              <p style={{ color: 'var(--text-low)', fontSize: 12 }}>
                {search
                  ? 'No customers match your search.'
                  : activeTab === 'active'
                    ? 'No active debts right now.'
                    : 'No paid customers yet.'}
              </p>
            </Card>
          ) : (
            <>
              {visibleList.map((customer, index) => (
                <DebtCard
                  key={customer.id}
                  customer={customer}
                  color={activeTab === 'active' ? AVATAR_COLORS[index % AVATAR_COLORS.length] : 'green'}
                  delay={index * .05}
                  onClick={() => navigate(`/customer/${customer.id}`)}
                />
              ))}

              {currentList.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  style={{
                    width: '100%',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    marginTop: 4,
                    background: 'var(--glass-fill-soft)',
                    color: 'var(--text-hi)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Load More ({currentList.length - visibleCount} more)
                </button>
              )}
            </>
          )}
        </>
      )}

    </div>
  </div>
)
}