import Card from '../components/ui/Card'
import useAppStore from '../store/useAppStore'

import {
  getInventoryHealth,
  getBestSeller,
  getHighestProfit,
  getLowStock,
  getOutOfStock,
} from '../utils/inventoryEngine'

export default function InventoryInsightsScreen() {
  const products = useAppStore((s) => s.products)
  const transactions = useAppStore((s) => s.transactions)

  const health = getInventoryHealth(products)
  const bestSeller = getBestSeller(products, transactions)
  const highestProfit = getHighestProfit(products, transactions)
  const lowStock = getLowStock(products)
  const outOfStock = getOutOfStock(products)

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
            fontSize: 44,
            margin: 0,
            color: health.color,
          }}
        >
          {health.score}%
        </h1>

        <p
          style={{
            color: health.color,
            fontWeight: 700,
          }}
        >
          {health.status}
        </p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3>🧠 AI Insights</h3>

        <p>
          🔥 Best Seller:{' '}
          {bestSeller
            ? `${bestSeller.name} (${bestSeller.sold} sold)`
            : 'No data'}
        </p>

        <p>
          💰 Highest Profit:{' '}
          {highestProfit
            ? `${highestProfit.name} (KES ${highestProfit.profit.toFixed(0)})`
            : 'No data'}
        </p>

        <p>
          ⚠ Low Stock: {lowStock.length}
        </p>

        <p>
          📦 Out of Stock: {outOfStock.length}
        </p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3>📦 Inventory Summary</h3>

        <p>Total products : {products.length}</p>

        <p>Low stock : {lowStock.length}</p>

        <p>Out of stock : {outOfStock.length}</p>

        <p>Healthy products : {products.length - lowStock.length - outOfStock.length}</p>
      </Card>

      <Card>
        <h3>🤖 AI Recommendation</h3>

        {outOfStock.length > 0 && (
          <p>
            Restock {outOfStock.length} products immediately.
          </p>
        )}

        {outOfStock.length === 0 &&
          lowStock.length > 0 && (
            <p>
              Plan a purchase order soon. {lowStock.length} products are running low.
            </p>
          )}

        {outOfStock.length === 0 &&
          lowStock.length === 0 && (
            <p>
              Excellent. Your inventory is healthy.
            </p>
          )}
      </Card>
    </div>
  )
}
