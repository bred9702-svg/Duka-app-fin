import ScreenContainer from '../components/layout/ScreenContainer'

export default function InventoryInsightsScreen() {
  return (
    <ScreenContainer>
      <div
        style={{
          padding: '16px 14px 24px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-hi)',
            marginBottom: 4,
          }}
        >
          Inventory Intelligence
        </h1>

        <p
          style={{
            color: 'var(--text-low)',
            fontSize: 12,
            marginBottom: 22,
          }}
        >
          AI powered inventory analysis.
        </p>

        <div
          className="glass-card"
          style={{
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 52,
              marginBottom: 10,
            }}
          >
            🧠
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              marginBottom: 10,
            }}
          >
            Coming Soon
          </h2>

          <p
            style={{
              color: 'var(--text-low)',
              lineHeight: 1.6,
            }}
          >
            Inventory Health, AI Insights, Best Sellers,
            Dead Stock, Restock Suggestions and much more.
          </p>
        </div>
      </div>
    </ScreenContainer>
  )
}
