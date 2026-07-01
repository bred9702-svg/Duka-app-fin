import SectionCard from './SectionCard'

export default function RestockSuggestionsCard({
  suggestions = [],
  compact = false,
}) {
  const items = compact
    ? suggestions.slice(0, 3)
    : suggestions

  return (
    <SectionCard
      title="📦 Restock"
      height={compact ? 190 : 260}
    >
      {items.length === 0 ? (
        <p
          style={{
            color: '#5FD97A',
            margin: 0,
            fontWeight: 600,
          }}
        >
          ✅ Nothing to reorder
        </p>
      ) : (
        <>
          {items.map((product) => (
            <div
              key={product.id}
              style={{
                padding: '8px 0',
                borderBottom:
                  '1px solid rgba(255,255,255,.08)',
              }}
            >
              <strong>{product.name}</strong>

              <p
                style={{
                  margin: '4px 0 0',
                  color: '#F0A93D',
                  fontSize: 12,
                }}
              >
                Order +{product.recommended}
              </p>
            </div>
          ))}

          {compact &&
            suggestions.length > 3 && (
              <p
                style={{
                  marginTop: 12,
                  color: '#F0A93D',
                  fontWeight: 600,
                }}
              >
                +{suggestions.length - 3} more
              </p>
            )}
        </>
      )}
    </SectionCard>
  )
}
