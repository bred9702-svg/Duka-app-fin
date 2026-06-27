export default function PaymentInput({
  customer,
  amount,
  setAmount,
  onRecord,
}) {
  if (customer.total_owed <= 0) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-low)',
          marginBottom: 8,
        }}
      >
        Record payment
      </p>

      <div
        style={{
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          value={amount}
          onChange={(e) =>
            setAmount(
              e.target.value.replace(/[^0-9]/g, '')
            )
          }
          placeholder="Amount (KES)"
          style={{
            flex: 1,
            border: '1px solid var(--glass-border)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 13,
            background: 'var(--glass-fill-soft)',
            color: 'var(--text-hi)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        />

        <button
          onClick={onRecord}
          disabled={!amount}
          style={{
            background:
              'linear-gradient(135deg,#FFC56B 0%,#F0A93D 100%)',
            color: '#2A1A05',
            border: '1px solid rgba(255,255,255,.4)',
            borderRadius: 10,
            padding: '10px 16px',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: amount ? 1 : .5,
            boxShadow: amount
              ? '0 6px 18px -6px rgba(240,169,61,.5)'
              : 'none',
          }}
        >
          Record
        </button>
      </div>
    </div>
  )
}
