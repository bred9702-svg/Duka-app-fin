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
  <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
    <div className="bg-blob" style={{ width: 150, height: 150, top: -40, right: -40, background: 'rgba(240,169,61,0.25)' }} />
    <div className="bg-blob" style={{ width: 120, height: 120, bottom: 200, left: -40, background: 'rgba(95,217,122,0.12)', animationDelay: '2s' }} />

    <div style={{ position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Inventory Intelligence
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 3 }}>
            AI powered inventory management
          </p>
        </div>
        <div className="glass-card" style={{ padding: '5px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5FD97A' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#5FD97A' }}>LIVE</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 6 }}>
        <HealthScoreCard health={health} />
      </div>

      {/* PERFORMANCE */}
      <SectionTitle>Performance</SectionTitle>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 14,
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
          marginBottom: 14,
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

      <div style={{ marginBottom: 14 }}>
        <AIAdvisorCard insights={insights} />
      </div>

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
  </div>
)
}
function SectionTitle({ children }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-low)',
        margin: '10px 0 8px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </p>
  )
}
