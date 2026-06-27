import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import { fmtKES } from '../../utils/formatters'

export default function CustomerHeader({ customer }) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Avatar
          name={customer.name}
          color="blue"
          size={60}
        />

        <div style={{ flex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-hi)',
            }}
          >
            {customer.name}
          </h2>

          <p
            style={{
              marginTop: 4,
              fontSize: 13,
              color: 'var(--text-low)',
            }}
          >
            {customer.phone || 'No phone number'}
          </p>

          <div
            style={{
              marginTop: 10,
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: 999,
              background:
                customer.total_owed > 0
                  ? 'rgba(255,107,91,.15)'
                  : 'rgba(95,217,122,.15)',
              color:
                customer.total_owed > 0
                  ? '#FF6B5B'
                  : '#5FD97A',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {customer.total_owed > 0 ? 'Active debt' : 'Paid'}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          paddingTop: 18,
          borderTop: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-low)',
            marginBottom: 6,
          }}
        >
          Outstanding balance
        </p>

        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 700,
            color:
              customer.total_owed > 0
                ? '#FF6B5B'
                : '#5FD97A',
          }}
        >
          {fmtKES(customer.total_owed)}
        </h1>
      </div>
    </Card>
  )
}
