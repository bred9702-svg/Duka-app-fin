import InventorySummaryCard from '../components/inventory/InventorySummaryCard'
import AIInsightsCard from '../components/inventory/AIInsightsCard'
import HealthScoreCard from '../components/inventory/HealthScoreCard'
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

    <HealthScoreCard health={health} />

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

<AIInsightsCard
  bestSeller={bestSeller}
  highestProfit={highestProfit}
  lowStock={lowStock}
  outOfStock={outOfStock}
/>
      <InventorySummaryCard
    totalProducts={products.length}
    lowStock={lowStock}
    outOfStock={outOfStock}
/>
    </div>
  )
}
