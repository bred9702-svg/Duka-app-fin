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
import {
  getBusinessScore,
  getGreeting,
  getBriefingSummary,
} from './aiAdvisorEngine'
import { generateSmartInsight } from './smartInsight'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

function getRevenueWindow(transactions, now = Date.now()) {
  const sales = transactions.filter((t) => t.operation_type === 'sale')

  const thisWeek = sales.filter(
    (t) => new Date(t.created_at || t.ts || now).getTime() >= now - WEEK_MS
  )
  const lastWeek = sales.filter((t) => {
    const ts = new Date(t.created_at || t.ts || now).getTime()
    return ts >= now - WEEK_MS * 2 && ts < now - WEEK_MS
  })

  const thisWeekTotal = thisWeek.reduce((a, t) => a + (t.amount || 0), 0)
  const lastWeekTotal = lastWeek.reduce((a, t) => a + (t.amount || 0), 0)

  const revenueDelta =
    lastWeekTotal > 0
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : null

  return { thisWeekTotal, lastWeekTotal, revenueDelta }
}

// ── 1. TODAY'S INSIGHT ────────────────────────────────────────────
function getTodaysInsight({ health, revenueDelta, debtsTotal, thisWeekTotal, topDebtor, lowStock }) {
  const score = getBusinessScore({ health, revenueDelta, debtsTotal, revenue: thisWeekTotal })
  const greeting = getGreeting()
  const summary = getBriefingSummary({ score, revenueDelta, topDebtor, lowStock })

  return {
    id: 'todays-insight',
    title: "Today's Insight",
    icon: 'star',
    color: '#F0A93D',
    headline: `${greeting} — Business score ${score.score}/100 (${score.label})`,
    detail: summary,
  }
}

// ── 2. SALES INSIGHT ──────────────────────────────────────────────
function getSalesInsight({ thisWeekTotal, revenueDelta, bestSeller }) {
  let headline
  let color = '#5B9FF0'

  if (revenueDelta === null) {
    headline = `${fmtKES(thisWeekTotal)} KES in sales this week`
  } else if (revenueDelta >= 0) {
    color = '#5FD97A'
    headline = `Sales are up ${revenueDelta}% vs last week`
  } else {
    color = '#FF6B5B'
    headline = `Sales are down ${Math.abs(revenueDelta)}% vs last week`
  }

  const detail = bestSeller
    ? `${bestSeller.name} is your best seller this period, with ${bestSeller.sold} unit(s) sold.`
    : 'No sales recorded yet — insights will improve as you log transactions.'

  return {
    id: 'sales-insight',
    title: 'Sales Insight',
    icon: 'trendingUp',
    color,
    headline,
    detail,
  }
}

// ── 3. INVENTORY INSIGHT ──────────────────────────────────────────
function getInventoryInsight({ health, lowStock, outOfStock, deadStock }) {
  const headline = `Inventory health: ${health.score}/100 (${health.status})`

  let detail
  if (outOfStock.length > 0) {
    detail = `${outOfStock.length} product(s) out of stock, including ${outOfStock[0].name}.`
  } else if (lowStock.length > 0) {
    detail = `${lowStock.length} product(s) running low, including ${lowStock[0].name}.`
  } else if (deadStock.length > 0) {
    detail = `${deadStock.length} product(s) haven't sold recently — consider a promotion.`
  } else {
    detail = 'Stock levels look healthy across your catalog.'
  }

  return {
    id: 'inventory-insight',
    title: 'Inventory Insight',
    icon: 'package',
    color: health.color,
    headline,
    detail,
  }
}

// ── 4. DEBT INSIGHT ───────────────────────────────────────────────
function getDebtInsight({ customers, transactions }) {
  const smart = generateSmartInsight(customers, transactions)

  return {
    id: 'debt-insight',
    title: 'Debt Insight',
    icon: 'userDollar',
    color: smart.color,
    headline: smart.title,
    detail: smart.message,
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

  const { thisWeekTotal, revenueDelta } = getRevenueWindow(transactions)

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
    thisWeekTotal,
    revenueDelta,
    customers,
    transactions,
  }

  return [
    getTodaysInsight(ctx),
    getSalesInsight(ctx),
    getInventoryInsight(ctx),
    getDebtInsight(ctx),
    getRecommendedAction(ctx),
  ]
}
