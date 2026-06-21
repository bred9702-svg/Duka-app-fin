import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import { fmtKES } from '../utils/formatters'

const AVATAR_COLORS = ['blue', 'amber', 'red', 'purple', 'green']

export default function DebtsScreen() {
  const navigate = useNavigate()
  const customers = useAppStore((s) => s.customers)

  const active = [...customers]
    .filter((c) => c.totalOwed > 0)
    .sort((a, b) => b.totalOwed - a.totalOwed)
  const cleared = customers.filter((c) => c.totalOwed === 0)
  const total = customers.reduce((a, c) => a + c.totalOwed, 0)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 130, height: 130, top: -30, left: -30, background: 'rgba(91,159,240,0.15)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 21,
              fontWeight: 700,
              color: 'var(--text-hi)',
              letterSpacing: '-0.02em',
            }}
          >
            Debts
          </h1>
          {total > 0 && (
            <span
              style={{
                background: 'rgba(255,107,91,0.18)',
                color: '#FF6B5B',
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 10,
              }}
            >
              {fmtKES(total)} KES total
            </span>
          )}
        </div>

        {active.length === 0 && cleared.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 24 }}>
            <Icon
              name="users"
              size={32}
              color="var(--text-low)"
              style={{ display: 'block', margin: '0 auto 8px' }}
            />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 4 }}>
              No customers yet
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-low)' }}>
              Add customers when classifying transactions as debts
            </p>
          </Card>
        )}

        {active.length > 0 && (
          <div>
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
              Active debts
            </p>
            {active.map((c, i) => (
              <div
                key={c.id}
                onClick={() => navigate(`/customer/${c.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'var(--glass-fill-soft)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  marginBottom: 8,
                  cursor: 'pointer',
                  animation: 'slideUp 0.4s ease-out backwards',
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <Avatar name={c.name} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-hi)' }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-low)' }}>
                    {c.payments.length} payment{c.payments.length !== 1 ? 's' : ''} recorded
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#FF6B5B' }}>
                    {fmtKES(c.totalOwed)}
                  </p>
                  <p style={{ fontSize: 9, color: 'var(--text-low)' }}>owed</p>
                </div>
                <Icon name="chevronRight" size={16} color="var(--text-low)" />
              </div>
            ))}
          </div>
        )}

        {cleared.length > 0 && (
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-low)',
                margin: '12px 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Cleared
            </p>
            {cleared.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/customer/${c.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'var(--glass-fill-soft)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  marginBottom: 8,
                  cursor: 'pointer',
                  opacity: 0.6,
                }}
              >
                <Avatar name={c.name} color="green" size={36} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-hi)' }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-low)' }}>Fully paid</p>
                </div>
                <Icon name="chevronRight" size={16} color="var(--text-low)" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
