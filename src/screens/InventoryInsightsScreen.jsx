import RestockSuggestionsCard from '../components/inventory/RestockSuggestionsCard'
import HighestProfitCard from '../components/inventory/HighestProfitCard'
import BestSellersCard from '../components/inventory/BestSellersCard'
import InventorySummaryCard from '../components/inventory/InventorySummaryCard'
import AIInsightsCard from '../components/inventory/AIInsightsCard'
import HealthScoreCard from '../components/inventory/HealthScoreCard'
import DeadStockCard from '../components/inventory/DeadStockCard'
import AIAdvisorCard from '../components/inventory/AIAdvisorCard'

import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
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
  const navigate = useNavigate()
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => navigate('/inventory-investment')}
            style={{
              width: 30, height: 30, borderRadius: 10, border: '1px solid var(--glass-border)',
              background: 'var(--glass-fill-soft)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Icon name="plus" size={15} color="#F0A93D" />
          </button>

          <div
            className="live-badge-blink"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 7px',
              fontSize: 8,
              letterSpacing: '.02em',
              fontWeight: 600,
              background: 'rgba(95,217,122,.12)',
              color: '#5FD97A',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5FD97A' }} />
            LIVE
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 8 }}>
        <HealthScoreCard health={health} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 8,
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 8,
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

      <div style={{ marginBottom: 8 }}>
        <AIAdvisorCard insights={insights} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <AIInsightsCard
          bestSeller={bestSeller}
          highestProfit={highestProfit}
          lowStock={lowStock}
          outOfStock={outOfStock}
        />
      </div>

      <InventorySummaryCard
        totalProducts={products.length}
        lowStock={lowStock}
        outOfStock={outOfStock}
      />
    </div>
  </div>
)
}
