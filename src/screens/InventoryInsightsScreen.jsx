import RestockSuggestionsCard from '../components/inventory/RestockSuggestionsCard'
import HighestProfitCard from '../components/inventory/HighestProfitCard'
import BestSellersCard from '../components/inventory/BestSellersCard'
import RecommendationCard from '../components/inventory/RecommendationCard'
import InventorySummaryCard from '../components/inventory/InventorySummaryCard'
import AIInsightsCard from '../components/inventory/AIInsightsCard'
import HealthScoreCard from '../components/inventory/HealthScoreCard'
import Card from '../components/ui/Card'
import useAppStore from '../store/useAppStore'
import DeadStockCard from '../components/inventory/DeadStockCard'
import AIAdvisorCard from '../components/inventory/AIAdvisorCard'

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
  const suggestions =
  getRestockSuggestions(
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
  const deadStock = getDeadStock(
  products,
  transactions
)

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
      <AIAdvisorCard insights={insights} />

      <InventorySummaryCard
    totalProducts={products.length}
    lowStock={lowStock}
    outOfStock={outOfStock}
/>
      <BestSellersCard
    bestSeller={bestSeller}
/>
      <HighestProfitCard
    highestProfit={highestProfit}
/>
      <DeadStockCard
    deadStock={deadStock}
/>
      <RestockSuggestionsCard
    suggestions={suggestions}
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
