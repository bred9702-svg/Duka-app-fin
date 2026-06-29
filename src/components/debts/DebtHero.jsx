import { fmtKES } from '../../utils/formatters'

export default function DebtHero({
  total = 0,
  customers = 0,
  activeDebts = 0,
}) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',

        background:
          'linear-gradient(135deg, rgba(255,107,91,.18), rgba(240,169,61,.10))',

        border: '1px solid rgba(255,255,255,.10)',

        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',

        borderRadius: 18,

        padding: 20,

        marginBottom: 16,

        boxShadow:
          '0 18px 45px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.08)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          right: -70,
          top: -70,
          borderRadius: '50%',
          background: 'rgba(255,107,91,.08)',
        }}
      />

      <p
        style={{
          fontSize: 11,
          color: 'var(--text-low)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          fontWeight: 600,
        }}
      >
        Outstanding Balance
      </p>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 34,
          fontWeight: 700,
          color: '#FF6B5B',
          margin: 0,
          letterSpacing: '-0.03em',
        }}
      >
        {fmtKES(total)} KES
      </h2>

      <p
        style={{
          marginTop: 8,
          fontSize: 13,
          color: 'var(--text-mid)',
        }}
      >
        Money waiting to be collected
      </p>

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 18,
        }}
      >
        <div
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(255,255,255,.05)',
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: 'var(--text-low)',
              marginBottom: 4,
            }}
          >
            Customers
          </p>

          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 18,
              color: 'white',
            }}
          >
            {customers}
          </p>
        </div>

        <div
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(255,255,255,.05)',
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: 'var(--text-low)',
              marginBottom: 4,
            }}
          >
            Overdue
          </p>

          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 18,
              color: overdue > 0 ? '#FF6B5B' : '#5FD97A',
            }}
          >
            {overdue}
          </p>
        </div>
      </div>
    </div>
  )
}
