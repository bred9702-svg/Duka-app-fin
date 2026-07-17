// Rule-based insight generation for the Duka AI screen.
// No external AI calls — everything here is derived deterministically
// from products/transactions/customers already in the store, reusing
// the existing inventory/debt/advisor engines instead of duplicating
// their logic.

import { fmtKES } from './formatters'
import {
  getInventoryHealth,
  getBestSeller,
  getLowStock,
  getOutOfStock,
  getDeadStock,
  getRestockSuggestions,
} from './inventoryEngine'
import { generateSmartInsight } from './smartInsight'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

function getRevenueWindow(transactions, now = Date.now()) {
  const sales = transactions.filter((t) => t.operation_type === 'sale')
  const expenses = transactions.filter((t) => t.operation_type === 'expense')

  const thisWeek = sales.filter(
    (t) => new Date(t.created_at || t.ts || now).getTime() >= now - WEEK_MS
  )
  const lastWeek = sales.filter((t) => {
    const ts = new Date(t.created_at || t.ts || now).getTime()
    return ts >= now - WEEK_MS * 2 && ts < now - WEEK_MS
  })

  const thisWeekTotal = thisWeek.reduce((a, t) => a + (t.amount || 0), 0)
  const lastWeekTotal = lastWeek.reduce((a, t) => a + (t.amount || 0), 0)
  const thisWeekProfit = thisWeek.reduce((a, t) => a + Number(t.profit || 0), 0)
  const lastWeekProfit = lastWeek.reduce((a, t) => a + Number(t.profit || 0), 0)
  const thisWeekExpenses = expenses
    .filter((t) => new Date(t.created_at || t.ts || now).getTime() >= now - WEEK_MS)
    .reduce((a, t) => a + Number(t.amount || 0), 0)
  const lastWeekExpenses = expenses
    .filter((t) => {
      const ts = new Date(t.created_at || t.ts || now).getTime()
      return ts >= now - WEEK_MS * 2 && ts < now - WEEK_MS
    })
    .reduce((a, t) => a + Number(t.amount || 0), 0)

  const revenueDelta =
    lastWeekTotal > 0
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : null

  const profitDelta = lastWeekProfit > 0
    ? Math.round(((thisWeekProfit - lastWeekProfit) / lastWeekProfit) * 100)
    : null

  return {
    thisWeekTotal,
    lastWeekTotal,
    revenueDelta,
    thisWeekProfit,
    lastWeekProfit,
    profitDelta,
    thisWeekExpenses,
    lastWeekExpenses,
  }
}

// ── 1. SALES TREND INSIGHT ────────────────────────────────────────
// Pure week-over-week trend — no product mix here, that's card 4.
function getSalesTrendInsight({ thisWeekTotal, lastWeekTotal, revenueDelta }) {
  let headline
  let color = '#5B9FF0'
  let detail

  if (revenueDelta === null) {
    headline = `${fmtKES(thisWeekTotal)} KES in sales this week`
    detail = thisWeekTotal > 0
      ? 'Not enough history yet to compare against last week.'
      : 'No sales recorded yet — trend insights will appear once you log sales.'
  } else if (revenueDelta >= 0) {
    color = '#5FD97A'
    headline = `Sales are up ${revenueDelta}% vs last week`
    detail = `${fmtKES(thisWeekTotal)} KES this week, up from ${fmtKES(lastWeekTotal)} KES last week.`
  } else {
    color = '#FF6B5B'
    headline = `Sales are down ${Math.abs(revenueDelta)}% vs last week`
    detail = `${fmtKES(thisWeekTotal)} KES this week, down from ${fmtKES(lastWeekTotal)} KES last week.`
  }

  return {
    id: 'sales-trend-insight',
    title: 'Sales Trend',
    icon: 'trendingUp',
    color,
    headline,
    detail,
  }
}

function getProfitQualityInsight({
  thisWeekTotal,
  thisWeekProfit,
  lastWeekProfit,
  profitDelta,
  thisWeekExpenses,
  lastWeekExpenses,
}) {
  const margin = thisWeekTotal > 0 ? Math.round((thisWeekProfit / thisWeekTotal) * 100) : null
  let color = '#F0A93D'
  let headline = `${fmtKES(thisWeekProfit)} KES product profit this week`
  let detail = margin === null
    ? 'Record product sales and cost prices to measure margin quality.'
    : `${margin}% recorded product margin, with ${fmtKES(thisWeekExpenses)} KES in classified expenses.`

  if (profitDelta !== null && profitDelta >= 0) {
    color = '#5FD97A'
    headline = `Product profit is up ${profitDelta}%`
    detail = `${fmtKES(thisWeekProfit)} KES this week versus ${fmtKES(lastWeekProfit)} KES last week; classified expenses are ${fmtKES(thisWeekExpenses)} KES.`
  } else if (profitDelta !== null) {
    color = '#FF6B5B'
    headline = `Product profit is down ${Math.abs(profitDelta)}%`
    const expenseSignal = thisWeekExpenses > lastWeekExpenses
      ? ` Expenses also increased from ${fmtKES(lastWeekExpenses)} to ${fmtKES(thisWeekExpenses)} KES.`
      : ''
    detail = `${fmtKES(thisWeekProfit)} KES this week versus ${fmtKES(lastWeekProfit)} KES last week.${expenseSignal}`
  }

  return {
    id: 'profit-quality-insight',
    title: 'Profit Quality',
    icon: 'cash',
    color,
    headline,
    detail,
  }
}

// ── 2. LOW / OUT-OF-STOCK INSIGHT ─────────────────────────────────
function getStockInsight({ lowStock, outOfStock }) {
  if (outOfStock.length > 0) {
    return {
      id: 'stock-insight',
      title: 'Low / Out of Stock',
      icon: 'package',
      color: '#FF6B5B',
      headline: `${outOfStock.length} product(s) out of stock`,
      detail: `Including ${outOfStock[0].name}${outOfStock.length > 1 ? ` and ${outOfStock.length - 1} other(s)` : ''} — restock to avoid lost sales.`,
    }
  }

  if (lowStock.length > 0) {
    return {
      id: 'stock-insight',
      title: 'Low / Out of Stock',
      icon: 'package',
      color: '#F0A93D',
      headline: `${lowStock.length} product(s) running low`,
      detail: `Including ${lowStock[0].name}${lowStock.length > 1 ? ` and ${lowStock.length - 1} other(s)` : ''} — plan a reorder soon.`,
    }
  }

  return {
    id: 'stock-insight',
    title: 'Low / Out of Stock',
    icon: 'package',
    color: '#5FD97A',
    headline: 'No stock issues right now',
    detail: 'All products are above their low-stock threshold.',
  }
}

// ── 3. DEBT RISK INSIGHT ──────────────────────────────────────────
function getDebtRiskInsight({ customers, transactions }) {
  const smart = generateSmartInsight(customers, transactions)

  return {
    id: 'debt-risk-insight',
    title: 'Debt Risk',
    icon: 'userDollar',
    color: smart.color,
    headline: smart.title,
    detail: smart.message,
  }
}

// ── 4. TOP-SELLING PRODUCT INSIGHT ────────────────────────────────
function getTopSellingProductInsight({ bestSeller }) {
  if (!bestSeller) {
    return {
      id: 'top-product-insight',
      title: 'Top-Selling Product',
      icon: 'star',
      color: '#5B9FF0',
      headline: 'No sales recorded yet',
      detail: 'Log a few sales to see which product is leading.',
    }
  }

  return {
    id: 'top-product-insight',
    title: 'Top-Selling Product',
    icon: 'star',
    color: '#F0A93D',
    headline: `${bestSeller.name} is your best seller`,
    detail: `${bestSeller.sold} unit(s) sold — consider featuring it near checkout to sustain momentum.`,
  }
}

// ── 5. RECOMMENDED ACTION ─────────────────────────────────────────
function getRecommendedAction({ outOfStock, restockSuggestions, topDebtor, deadStock, bestSeller }) {
  if (outOfStock.length > 0) {
    return {
      id: 'recommended-action',
      title: 'Recommended Action',
      icon: 'circleCheck',
      color: '#FF6B5B',
      headline: `Restock ${outOfStock[0].name} today`,
      detail: `${outOfStock[0].name} is out of stock — restocking it first avoids lost sales.`,
    }
  }

  if (restockSuggestions.length > 0) {
    const top = restockSuggestions[0]
    return {
      id: 'recommended-action',
      title: 'Recommended Action',
      icon: 'circleCheck',
      color: '#F0A93D',
      headline: `Reorder ${top.name}`,
      detail: `${top.recommended} unit(s) recommended based on recent sales velocity.`,
    }
  }

  if (topDebtor) {
    return {
      id: 'recommended-action',
      title: 'Recommended Action',
      icon: 'circleCheck',
      color: '#5B9FF0',
      headline: `Follow up with ${topDebtor.name}`,
      detail: `${fmtKES(topDebtor.total_owed)} KES owed — a reminder today could improve cash flow.`,
    }
  }

  if (deadStock.length > 0) {
    return {
      id: 'recommended-action',
      title: 'Recommended Action',
      icon: 'circleCheck',
      color: '#7C5CFC',
      headline: `Promote ${deadStock[0].name}`,
      detail: 'This item hasn\u2019t sold recently — a discount or bundle could clear the stock.',
    }
  }

  if (bestSeller) {
    return {
      id: 'recommended-action',
      title: 'Recommended Action',
      icon: 'circleCheck',
      color: '#5FD97A',
      headline: `Keep promoting ${bestSeller.name}`,
      detail: 'It\u2019s your top performer — consider featuring it near checkout to sustain momentum.',
    }
  }

  return {
    id: 'recommended-action',
    title: 'Recommended Action',
    icon: 'circleCheck',
    color: '#5FD97A',
    headline: 'No urgent action needed',
    detail: 'Everything looks steady. Keep logging sales to unlock more tailored recommendations.',
  }
}

// ── MAIN ENTRY POINT ──────────────────────────────────────────────
export function getDukaAIInsights({ products = [], transactions = [], customers = [] }) {
  const health = getInventoryHealth(products)
  const bestSeller = getBestSeller(products, transactions)
  const lowStock = getLowStock(products)
  const outOfStock = getOutOfStock(products)
  const deadStock = getDeadStock(products, transactions)
  const restockSuggestions = getRestockSuggestions(products, transactions)

  const debtors = customers
    .filter((c) => (c.total_owed || 0) > 0)
    .sort((a, b) => (b.total_owed || 0) - (a.total_owed || 0))
  const topDebtor = debtors[0] || null
  const debtsTotal = debtors.reduce((a, c) => a + (c.total_owed || 0), 0)

  const performance = getRevenueWindow(transactions)

  const ctx = {
    health,
    bestSeller,
    lowStock,
    outOfStock,
    deadStock,
    restockSuggestions,
    debtors,
    topDebtor,
    debtsTotal,
    ...performance,
    customers,
    transactions,
  }

  return [
    getSalesTrendInsight(ctx),
    getProfitQualityInsight(ctx),
    getStockInsight(ctx),
    getDebtRiskInsight(ctx),
    getTopSellingProductInsight(ctx),
    getRecommendedAction(ctx),
  ]
}
