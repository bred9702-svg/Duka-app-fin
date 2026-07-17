// Rule-based actionable recommendations for the Duka AI screen.
// No external AI calls — derived deterministically from products/
// transactions/customers, reusing the existing inventory/debt engines.
// Each recommendation carries an explicit "why" in its `detail` field.

import { fmtKES } from './formatters'
import {
  getRestockSuggestions,
  getOutOfStock,
  getDeadStock,
  getBestSeller,
} from './inventoryEngine'

function getProductSalesMap(transactions = []) {
  const map = {}
  transactions
    .filter((t) => t.operation_type === 'sale' && t.product_id)
    .forEach((t) => {
      map[t.product_id] = (map[t.product_id] || 0) + (t.quantity || 1)
    })
  return map
}

function productText(product = {}) {
  return `${product.name || ''} ${product.category || ''}`.toLowerCase()
}

function getMarginRecommendation({ products }) {
  const candidates = products
    .filter((product) => Number(product.unit_price || 0) > 0 && Number(product.stock_current || 0) > 0)
    .map((product) => ({
      ...product,
      marginValue: Number(product.unit_price || 0) - Number(product.cost_price || 0),
    }))
    .filter((product) => product.marginValue > 0)
    .sort((a, b) => b.marginValue - a.marginValue)

  if (!candidates.length) {
    return {
      id: 'margin-recommendation',
      title: 'Margin Opportunity',
      icon: 'cash',
      color: '#5B9FF0',
      headline: 'Add cost prices to unlock margin analysis',
      detail: 'Why: Dukwise needs both cost and selling prices to identify the products that contribute the most cash per unit.',
    }
  }

  const top = candidates[0]
  return {
    id: 'margin-recommendation',
    title: 'Margin Opportunity',
    icon: 'cash',
    color: '#F0A93D',
    headline: `${top.name} adds ${fmtKES(top.marginValue)} KES per unit`,
    detail: `Why: it has the strongest recorded unit margin among products currently in stock. Recommend it when it genuinely fits the customer's request.`,
  }
}

function getBundleRecommendation({ products, transactions }) {
  const salesMap = getProductSalesMap(transactions)
  const alcoholWords = ['gin', 'vodka', 'whisky', 'whiskey', 'rum', 'tequila', 'brandy', 'cognac', 'wine']
  const mixerWords = ['tonic', 'soda', 'coke', 'cola', 'juice', 'water', 'energy', 'sprite', 'fanta']
  const anchors = products
    .filter((product) => alcoholWords.some((word) => productText(product).includes(word)))
    .sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0))
  const mixers = products.filter((product) => mixerWords.some((word) => productText(product).includes(word)))

  if (!anchors.length) {
    return {
      id: 'bundle-recommendation',
      title: 'Bundle Opportunity',
      icon: 'star',
      color: '#7C5CFC',
      headline: 'Use clearer product categories for matching',
      detail: 'Why: categories such as Gin, Whisky, Wine, Tonic and Juice let Dukwise recommend bundles using products actually stocked in your shop.',
    }
  }

  const anchor = anchors[0]
  const text = productText(anchor)
  let mixer = mixers[0]
  if (text.includes('gin')) mixer = mixers.find((product) => productText(product).includes('tonic')) || mixer
  if (text.includes('vodka')) mixer = mixers.find((product) => /juice|energy|soda/.test(productText(product))) || mixer
  if (/whisky|whiskey|rum|brandy|cognac/.test(text)) {
    mixer = mixers.find((product) => /coke|cola|soda|water/.test(productText(product))) || mixer
  }

  if (!mixer) {
    return {
      id: 'bundle-recommendation',
      title: 'Bundle Opportunity',
      icon: 'star',
      color: '#7C5CFC',
      headline: `${anchor.name} needs a complementary mixer`,
      detail: 'Why: it can anchor a higher-value basket, but no suitable mixer is currently identifiable in your catalogue.',
    }
  }

  return {
    id: 'bundle-recommendation',
    title: 'Bundle Opportunity',
    icon: 'star',
    color: '#7C5CFC',
    headline: `Test ${anchor.name} + ${mixer.name}`,
    detail: 'Why: both products already exist in your catalogue. Use a small discount only if the combined selling price stays safely above combined cost.',
  }
}

function getTopDebtor(customers = []) {
  return customers
    .filter((c) => (c.total_owed || 0) > 0)
    .sort((a, b) => (b.total_owed || 0) - (a.total_owed || 0))[0] || null
}

// ── 1. WHAT TO RESTOCK ────────────────────────────────────────────
function getRestockRecommendation({ products, transactions }) {
  const outOfStock = getOutOfStock(products)
  const suggestions = getRestockSuggestions(products, transactions)

  if (outOfStock.length > 0) {
    const p = outOfStock[0]
    return {
      id: 'restock-recommendation',
      title: 'What to Restock',
      icon: 'package',
      color: '#FF6B5B',
      headline: `Restock ${p.name}`,
      detail: `Why: ${p.name} is completely out of stock — every day it stays empty is a lost sale.`,
    }
  }

  if (suggestions.length > 0) {
    const top = suggestions[0]
    return {
      id: 'restock-recommendation',
      title: 'What to Restock',
      icon: 'package',
      color: '#F0A93D',
      headline: `Reorder ${top.name} — ${top.recommended} unit(s)`,
      detail: `Why: only ${top.stock_current ?? 0} unit(s) left and ${top.sold} sold recently, so it's about to run out.`,
    }
  }

  return {
    id: 'restock-recommendation',
    title: 'What to Restock',
    icon: 'package',
    color: '#5FD97A',
    headline: 'Nothing needs restocking right now',
    detail: 'Why: all products are above their low-stock threshold.',
  }
}

// ── 2. WHICH DEBT TO FOLLOW UP ────────────────────────────────────
function getDebtFollowUpRecommendation({ customers }) {
  const topDebtor = getTopDebtor(customers)

  if (!topDebtor) {
    return {
      id: 'debt-followup-recommendation',
      title: 'Which Debt to Follow Up',
      icon: 'userDollar',
      color: '#5FD97A',
      headline: 'No debts to follow up',
      detail: 'Why: no customer currently has an outstanding balance.',
    }
  }

  return {
    id: 'debt-followup-recommendation',
    title: 'Which Debt to Follow Up',
    icon: 'userDollar',
    color: '#5B9FF0',
    headline: `Follow up with ${topDebtor.name}`,
    detail: `Why: ${topDebtor.name} owes ${fmtKES(topDebtor.total_owed)} KES — the largest outstanding balance of all your customers.`,
  }
}

// ── 3. WHICH PRODUCT IS UNDERPERFORMING ───────────────────────────
function getUnderperformerRecommendation({ products, transactions }) {
  const deadStock = getDeadStock(products, transactions)

  if (deadStock.length > 0) {
    const worst = [...deadStock].sort(
      (a, b) => (b.stock_current ?? 0) - (a.stock_current ?? 0)
    )[0]

    return {
      id: 'underperformer-recommendation',
      title: 'Underperforming Product',
      icon: 'alertTriangle',
      color: '#FF6B5B',
      headline: `${worst.name} isn't selling`,
      detail: `Why: it has ${worst.stock_current ?? 0} unit(s) in stock but zero recorded sales — capital is sitting on the shelf.`,
    }
  }

  const salesMap = getProductSalesMap(transactions)
  const soldProducts = products
    .filter((p) => (salesMap[p.id] || 0) > 0)
    .map((p) => ({ ...p, sold: salesMap[p.id] }))
    .sort((a, b) => a.sold - b.sold)

  if (soldProducts.length > 0) {
    const weakest = soldProducts[0]
    return {
      id: 'underperformer-recommendation',
      title: 'Underperforming Product',
      icon: 'alertTriangle',
      color: '#F0A93D',
      headline: `${weakest.name} is your weakest seller`,
      detail: `Why: only ${weakest.sold} unit(s) sold — the fewest of any product with recorded sales.`,
    }
  }

  return {
    id: 'underperformer-recommendation',
    title: 'Underperforming Product',
    icon: 'alertTriangle',
    color: '#5FD97A',
    headline: 'Not enough sales data yet',
    detail: 'Why: no products have recorded sales to compare performance.',
  }
}

// ── 4. WHICH PRODUCT IS SELLING FASTEST ───────────────────────────
function getFastestSellerRecommendation({ products, transactions }) {
  const bestSeller = getBestSeller(products, transactions)

  if (!bestSeller) {
    return {
      id: 'fastest-seller-recommendation',
      title: 'Fastest-Selling Product',
      icon: 'trendingUp',
      color: '#5B9FF0',
      headline: 'No sales recorded yet',
      detail: 'Why: log a few sales to see which product moves fastest.',
    }
  }

  return {
    id: 'fastest-seller-recommendation',
    title: 'Fastest-Selling Product',
    icon: 'trendingUp',
    color: '#5FD97A',
    headline: `${bestSeller.name} is selling fastest`,
    detail: `Why: it sold ${bestSeller.sold} unit(s) — more than any other product. Keep it well stocked.`,
  }
}

// ── 5. ONE PRIORITY ACTION FOR TODAY ──────────────────────────────
function getPriorityActionRecommendation({ products, transactions, customers }) {
  const outOfStock = getOutOfStock(products)
  if (outOfStock.length > 0) {
    return {
      id: 'priority-action-recommendation',
      title: "Today's Priority Action",
      icon: 'circleCheck',
      color: '#FF6B5B',
      headline: `Restock ${outOfStock[0].name} first`,
      detail: `Why: it's completely out of stock right now — the most urgent issue, since it's actively costing you sales.`,
    }
  }

  const topDebtor = getTopDebtor(customers)
  if (topDebtor && topDebtor.total_owed > 0) {
    return {
      id: 'priority-action-recommendation',
      title: "Today's Priority Action",
      icon: 'circleCheck',
      color: '#5B9FF0',
      headline: `Collect from ${topDebtor.name}`,
      detail: `Why: ${fmtKES(topDebtor.total_owed)} KES is outstanding — the largest single amount you could recover today.`,
    }
  }

  const suggestions = getRestockSuggestions(products, transactions)
  if (suggestions.length > 0) {
    const top = suggestions[0]
    return {
      id: 'priority-action-recommendation',
      title: "Today's Priority Action",
      icon: 'circleCheck',
      color: '#F0A93D',
      headline: `Reorder ${top.name}`,
      detail: `Why: stock is running low relative to recent sales — reordering now avoids a stockout later.`,
    }
  }

  const deadStock = getDeadStock(products, transactions)
  if (deadStock.length > 0) {
    return {
      id: 'priority-action-recommendation',
      title: "Today's Priority Action",
      icon: 'circleCheck',
      color: '#7C5CFC',
      headline: `Promote ${deadStock[0].name}`,
      detail: 'Why: it has stock but no sales — a discount or bundle can free up cash tied to it.',
    }
  }

  const bestSeller = getBestSeller(products, transactions)
  if (bestSeller) {
    return {
      id: 'priority-action-recommendation',
      title: "Today's Priority Action",
      icon: 'circleCheck',
      color: '#5FD97A',
      headline: `Keep featuring ${bestSeller.name}`,
      detail: 'Why: nothing urgent needs attention — sustaining your best seller is the highest-value use of today.',
    }
  }

  return {
    id: 'priority-action-recommendation',
    title: "Today's Priority Action",
    icon: 'circleCheck',
    color: '#5FD97A',
    headline: 'No urgent action needed',
    detail: 'Why: no stock, debt, or sales issues were detected in your current data.',
  }
}

// ── MAIN ENTRY POINT ──────────────────────────────────────────────
export function getDukaAIRecommendations({ products = [], transactions = [], customers = [] }) {
  const ctx = { products, transactions, customers }

  return [
    getRestockRecommendation(ctx),
    getMarginRecommendation(ctx),
    getBundleRecommendation(ctx),
    getDebtFollowUpRecommendation(ctx),
    getUnderperformerRecommendation(ctx),
    getFastestSellerRecommendation(ctx),
    getPriorityActionRecommendation(ctx),
  ]
}
