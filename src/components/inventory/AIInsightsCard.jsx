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
        padding: 12,
        background: 'rgba(255,255,255,.02)',
        border: '1px solid rgba(255,255,255,.10)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: 'none',
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 12,
          fontSize: 10,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
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
        />

        <Insight
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
        />

        <Insight
          label="Low Stock"
          value={lowStock.length}
          sub="Products"
        />

        <Insight
          label="Out"
          value={outOfStock.length}
          sub="Products"
        />
      </div>
    </Card>
  )
}

function Insight({
  label,
  value,
  sub,
}) {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, rgba(28,28,28,.65) 0%, rgba(18,18,18,.72) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 10,
        padding: '10px 12px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,.06), 0 8px 20px -6px rgba(0,0,0,.45)',
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 8,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--text-low)',
          opacity: 0.85,
          lineHeight: 1,
        }}
      >
        {label}
      </p>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.015em',
          color: 'var(--text-hi)',
          lineHeight: 1.15,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 7,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--text-low)',
          opacity: 0.7,
          lineHeight: 1.2,
        }}
      >
        {sub}
      </div>
    </div>
  )
}
