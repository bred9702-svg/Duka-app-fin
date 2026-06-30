import Card from '../components/ui/Card'

export default function InventoryInsightsScreen() {
  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        padding: '16px 14px 20px',
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
          marginBottom: 20,
        }}
      >
        AI powered inventory management.
      </p>

      <Card style={{ marginBottom: 16 }}>
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-low)',
            marginBottom: 8,
          }}
        >
          INVENTORY HEALTH
        </p>

        <h1
          style={{
            fontSize: 42,
            margin: 0,
            color: '#5FD97A',
          }}
        >
          94%
        </h1>

        <p
          style={{
            color: '#5FD97A',
            fontWeight: 600,
          }}
        >
          Excellent
        </p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3>🧠 AI Insights</h3>

        <p>🔥 Best seller: --</p>

        <p>💰 Highest profit: --</p>

        <p>⚠ Low stock: --</p>

        <p>📦 Out of stock: --</p>

        <p>😴 Dead stock: --</p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3>📦 Inventory Summary</h3>

        <p>Total products : --</p>

        <p>Low stock : --</p>

        <p>Out of stock : --</p>

        <p>Dead stock : --</p>
      </Card>

      <Card>
        <h3>🤖 AI Recommendation</h3>

        <p>
          Your recommendations will appear here automatically.
        </p>
      </Card>
    </div>
  )
}
