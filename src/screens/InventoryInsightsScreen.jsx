import RestockSuggestionsCard from '../components/inventory/RestockSuggestionsCard'
import HighestProfitCard from '../components/inventory/HighestProfitCard'
import BestSellersCard from '../components/inventory/BestSellersCard'
import RecommendationCard from '../components/inventory/RecommendationCard'
import InventorySummaryCard from '../components/inventory/InventorySummaryCard'
import AIInsightsCard from '../components/inventory/AIInsightsCard'
import HealthScoreCard from '../components/inventory/HealthScoreCard'
import DeadStockCard from '../components/inventory/DeadStockCard'
import AIAdvisorCard from '../components/inventory/AIAdvisorCard'

import useAppStore from '../store/useAppStore'

import { generateBusinessInsights } from '../utils/aiAdvisor'

import {
  getInventoryHealth,
  getBestSeller,
  getHighestProfit,
  getLowStock,
  getOutOfStock,
  getDeadStock,
  getRestockSuggestions,
} from '../utils/inventoryEngine'

export default function InventoryInsightsScreen() {
  const products = useAppStore((s) => s.products)
  const transactions = useAppStore((s) => s.transactions)

  const health = getInventoryHealth(products)
  const bestSeller = getBestSeller(products, transactions)
  const highestProfit = getHighestProfit(products, transactions)
  const lowStock = getLowStock(products)
  const outOfStock = getOutOfStock(products)

  const deadStock = getDeadStock(products, transactions)

  const suggestions = getRestockSuggestions(
    products,
    transactions
  )

  const insights = generateBusinessInsights({
    health,
    bestSeller,
    highestProfit,
    lowStock,
    outOfStock,
    deadStock,
    suggestions,
  })

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
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
          marginBottom: 20,
        }}
      >
        AI powered inventory management.
      </p>

      <HealthScoreCard health={health} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <BestSellersCard
  bestSeller={bestSeller}
  compact
/>

        <HighestProfitCard
          highestProfit={highestProfit}
        />
      </div>

      <AIAdvisorCard insights={insights} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <DeadStockCard
          deadStock={deadStock}
        />

        <RestockSuggestionsCard
          suggestions={suggestions}
        />
      </div>

      <InventorySummaryCard
        totalProducts={products.length}
        lowStock={lowStock}
        outOfStock={outOfStock}
      />

      <AIInsightsCard
        bestSeller={bestSeller}
        highestProfit={highestProfit}
        lowStock={lowStock}
        outOfStock={outOfStock}
      />

      <RecommendationCard
        lowStock={lowStock}
        outOfStock={outOfStock}
      />
    </div>
  )
}
