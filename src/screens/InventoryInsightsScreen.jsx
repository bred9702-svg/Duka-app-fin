import RestockSuggestionsCard from '../components/inventory/RestockSuggestionsCard'
import HighestProfitCard from '../components/inventory/HighestProfitCard'
import BestSellersCard from '../components/inventory/BestSellersCard'
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
      padding: '12px 10px 18px',
    }}
  >
    {/* Header */}
    <h1
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        fontWeight: 700,
        color: 'var(--text-hi)',
        margin: 0,
      }}
    >
      Inventory Intelligence
    </h1>

    <p
      style={{
        margin: '2px 0 12px',
        color: 'var(--text-low)',
        fontSize: 11,
      }}
    >
      AI powered inventory management
    </p>

    {/* Hero */}
    <HealthScoreCard health={health} />

    {/* PERFORMANCE */}
    <SectionTitle>Performance</SectionTitle>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        marginBottom: 10,
      }}
    >
      <BestSellersCard
        bestSeller={bestSeller}
        compact
      />

      <HighestProfitCard
        highestProfit={highestProfit}
        compact
      />
    </div>

    {/* INVENTORY */}
    <SectionTitle>Inventory</SectionTitle>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        marginBottom: 10,
      }}
    >
      <DeadStockCard
        deadStock={deadStock}
        compact
      />

      <RestockSuggestionsCard
        suggestions={suggestions}
        compact
      />
    </div>

    {/* AI */}
    <SectionTitle>AI Assistant</SectionTitle>

    <AIAdvisorCard insights={insights} />

    <AIInsightsCard
      bestSeller={bestSeller}
      highestProfit={highestProfit}
      lowStock={lowStock}
      outOfStock={outOfStock}
    />

    {/* SUMMARY */}
    <SectionTitle>Summary</SectionTitle>

    <InventorySummaryCard
      totalProducts={products.length}
      lowStock={lowStock}
      outOfStock={outOfStock}
    />
  </div>
)
}
function SectionTitle({ children }) {
  return (
    <p
      style={{
        margin: '10px 0 4px',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: 'var(--text-low)',
      }}
    >
      {children}
    </p>
  )
}
