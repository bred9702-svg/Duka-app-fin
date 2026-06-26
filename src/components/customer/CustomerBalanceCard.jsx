import { fmtKES } from '../../utils/formatters'

export default function CustomerBalanceCard({ customer }) {
  if (!customer) return null

  const outstanding = customer.total_owed || 0

  // Ces valeurs seront remplacées plus tard
  // par les vraies données calculées.
  const totalPurchases = customer.total_purchases || outstanding
  const totalPaid = totalPurchases - outstanding

  return (
    <div
      style={{
        marginBottom: 18,

        padding: 18,

        borderRadius: 20,

        background:
          'linear-gradient(135deg, rgba(240,169,61,.12), rgba(255,255,255,.04))',

        border: '1px solid rgba(240,169,61,.18)',

        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',

        boxShadow:
          '0 18px 40px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.08)',
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-low)',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        Outstanding Balance
      </p>

      <h1
        style={{
          margin: 0,
          marginBottom: 18,

          fontFamily: 'var(--font-display)',

          fontSize: 34,

          fontWeight: 700,

          color:
            outstanding > 0
              ? '#FF6B5B'
              : '#5FD97A',
        }}
      >
        {fmtKES(outstanding)} KES
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              color: 'var(--text-low)',
              marginBottom: 4,
            }}
          >
            Purchases
          </p>

          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#F0A93D',
              margin: 0,
            }}
          >
            {fmtKES(totalPurchases)}
          </p>
        </div>

        <div>
          <p
            style={{
              fontSize: 10,
              color: 'var(--text-low)',
              marginBottom: 4,
            }}
          >
            Paid
          </p>

          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#5FD97A',
              margin: 0,
            }}
          >
            {fmtKES(totalPaid)}
          </p>
        </div>
      </div>
    </div>
  )
}
