import Icon from '../ui/Icon'
import { fmtKES } from '../../utils/formatters'

export default function PurchaseHistory({ purchases = [] }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          marginBottom: 10,
        }}
      >
        Purchase History
      </p>

      {purchases.length === 0 ? (
        <EmptyState />
      ) : (
        purchases.map((purchase) => (
          <PurchaseItem
            key={purchase.id}
            purchase={purchase}
          />
        ))
      )}
    </div>
  )
}

function PurchaseItem({ purchase }) {
  return (
    <div
      style={{
        background: 'var(--glass-fill-soft)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',

        borderRadius: 16,

        padding: 14,

        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 600,
              color: 'var(--text-hi)',
              marginBottom: 3,
            }}
          >
            {purchase.product}
          </p>

          <p
            style={{
              fontSize: 11,
              color: 'var(--text-low)',
            }}
          >
            {purchase.date}
          </p>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            color: '#F0A93D',
          }}
        >
          {fmtKES(purchase.amount)} KES
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-mid)',
          }}
        >
          Qty × {purchase.quantity}
        </span>

        <Status paid={purchase.paid} />
      </div>
    </div>
  )
}

function Status({ paid }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <Icon
        name={paid ? 'circleCheck' : 'clock'}
        size={13}
        color={paid ? '#5FD97A' : '#FF6B5B'}
      />

      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: paid ? '#5FD97A' : '#FF6B5B',
        }}
      >
        {paid ? 'Paid' : 'Unpaid'}
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 22,
        textAlign: 'center',
        background: 'var(--glass-fill-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
      }}
    >
      <Icon
        name="receipt"
        size={30}
        color="var(--text-low)"
      />

      <p
        style={{
          marginTop: 10,
          fontSize: 12,
          color: 'var(--text-low)',
        }}
      >
        No purchases found
      </p>
    </div>
  )
}
