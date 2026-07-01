import Card from '../ui/Card'

export default function AIInsightsCard({
  bestSeller,
  highestProfit,
  lowStock,
  outOfStock,
}) {
  return (
    <Card
      style={{
        marginBottom: 16,
        padding: 14,
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 12,
          fontSize: 10,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          fontWeight: 600,
        }}
      >
        AI Insights
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <Insight
          icon="🔥"
          label="Best Seller"
          value={
            bestSeller
              ? bestSeller.name
              : "—"
          }
          sub={
            bestSeller
              ? `${bestSeller.sold} sold`
              : "No sales"
          }
          color="#5FD97A"
        />

        <Insight
          icon="💰"
          label="Top Profit"
          value={
            highestProfit
              ? highestProfit.name
              : "—"
          }
          sub={
            highestProfit
              ? `KES ${Math.round(highestProfit.profit).toLocaleString()}`
              : "No data"
          }
          color="#F0A93D"
        />

        <Insight
          icon="⚠️"
          label="Low Stock"
          value={lowStock.length}
          sub="Products"
          color="#F0A93D"
        />

        <Insight
          icon="📦"
          label="Out"
          value={outOfStock.length}
          sub="Products"
          color="#FF6B5B"
        />
      </div>
    </Card>
  )
}

function Insight({
  icon,
  label,
  value,
  sub,
  color,
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 10,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>
          {icon}
        </span>

        <span
          style={{
            fontSize: 9,
            color: 'var(--text-low)',
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-hi)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          color,
        }}
      >
        {sub}
      </div>
    </div>
  )
}
