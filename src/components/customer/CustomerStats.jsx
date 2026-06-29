import Card from '../ui/Card'
import { fmtKES } from '../../utils/formatters'

export default function CustomerStats({
  customer,
  lastPaymentLabel = 'Never',
  activeDebtCount = 0,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 10,
        marginBottom: 18,
      }}
    >
      {/* Outstanding */}
      <Card
        style={{
          padding: 14,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 10,
            color: 'var(--text-low)',
            marginBottom: 6,
          }}
        >
          Outstanding
        </p>

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 700,
            color:
              (customer.total_owed || 0) > 0
                ? '#FF6B5B'
                : '#5FD97A',
          }}
        >
          {fmtKES(customer.total_owed || 0)}
        </p>
      </Card>

      {/* Active Debts */}
      <Card
        style={{
          padding: 14,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 10,
            color: 'var(--text-low)',
            marginBottom: 6,
          }}
        >
          Active Debts
        </p>

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color:
              activeDebtCount > 0
                ? '#F0A93D'
                : '#5FD97A',
          }}
        >
          {activeDebtCount}
        </p>
      </Card>

      {/* Last Payment */}
      <Card
        style={{
          padding: 14,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 10,
            color: 'var(--text-low)',
            marginBottom: 6
            
          }}
        >
          Last Payment
        </p>

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-hi)',
          }}
        >
          {lastPaymentLabel}
        </p>
      </Card>
    </div>
  )
}
