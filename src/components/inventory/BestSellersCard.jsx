import SectionCard from './SectionCard'

export default function BestSellersCard({
  bestSeller,
  compact = false,
}) {
  return (
    <SectionCard
      title="🔥 Best Seller"
      height={compact ? 190 : 260}
    >
      {bestSeller ? (
        <>
          <h2
            style={{
              margin: 0,
              color: 'var(--text-hi)',
              fontSize: compact ? 18 : 24,
            }}
          >
            {bestSeller.name}
          </h2>

          <p
            style={{
              marginTop: 12,
              color: '#5FD97A',
              fontWeight: 700,
              fontSize: compact ? 14 : 16,
            }}
          >
            {bestSeller.sold} sold
          </p>

          <div
            style={{
              marginTop: 18,
            }}
          >
            <small
              style={{
                color: 'var(--text-low)',
              }}
            >
              Category
            </small>

            <p
              style={{
                margin: '6px 0 0',
                fontWeight: 600,
              }}
            >
              {bestSeller.category}
            </p>
          </div>
        </>
      ) : (
        <p>No sales yet.</p>
      )}
    </SectionCard>
  )
}
