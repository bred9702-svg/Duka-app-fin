import { fmtKES } from './formatters'

// ── BUSINESS SCORE ──────────────────────────────────────────────
export function getBusinessScore({ health, revenueDelta, debtsTotal, revenue }) {
  let score = health?.score ?? 80

  if (revenueDelta !== null && revenueDelta !== undefined) {
    score += Math.max(-15, Math.min(15, revenueDelta / 2))
  }

  if (revenue > 0 && debtsTotal > 0) {
    const debtRatio = debtsTotal / revenue
    score -= Math.min(20, debtRatio * 40)
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  let label = 'Excellent'
  if (score < 85) label = 'Good'
  if (score < 65) label = 'Needs Attention'
  if (score < 40) label = 'Critical'

  return { score, label }
}

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function getBriefingSummary({ score, revenueDelta, topDebtor, lowStock }) {
  if (score.score >= 85 && (revenueDelta ?? 0) >= 0) {
    return "Business is running smoothly today. Keep the momentum going."
  }
  if (lowStock.length > 0 && topDebtor) {
    return `Watch your stock levels and follow up with ${topDebtor.name} today.`
  }
  if (lowStock.length > 0) {
    return 'A few products need restocking soon — nothing urgent yet.'
  }
  if (topDebtor) {
    return `${topDebtor.name} has an outstanding balance worth following up on.`
  }
  return 'Steady day so far. No major issues detected.'
}

// ── TODAY'S PRIORITIES ──────────────────────────────────────────
export function getPriorities({ restockSuggestions, topDebtor, deadStock, outOfStock }) {
  const items = []

  if (outOfStock.length > 0) {
    items.push({
      icon: 'package',
      color: '#FF6B5B',
      label: `Restock ${outOfStock[0].name}`,
      detail: `Out of stock${outOfStock.length > 1 ? ` — ${outOfStock.length} products affected` : ''}`,
    })
  } else if (restockSuggestions.length > 0) {
    items.push({
      icon: 'package',
      color: '#F0A93D',
      label: `Restock ${restockSuggestions[0].name}`,
      detail: `${restockSuggestions[0].recommended} units recommended`,
    })
  }

  if (topDebtor) {
    items.push({
      icon: 'userDollar',
      color: '#5B9FF0',
      label: `Follow up with ${topDebtor.name}`,
      detail: `${fmtKES(topDebtor.total_owed)} KES owed`,
    })
  }

  if (deadStock.length > 0) {
    items.push({
      icon: 'package',
      color: '#7C5CFC',
      label: 'Reduce slow-moving inventory',
      detail: `${deadStock.length} product(s) haven't sold`,
    })
  }

  if (items.length < 3) {
    items.push({
      icon: 'trendingUp',
      color: '#5FD97A',
      label: 'Review your best sellers',
      detail: 'Consider a bundle or promotion',
    })
  }

  return items.slice(0, 3)
}

// ── RECOMMENDATIONS (Business data + Wine & Spirits expertise) ──
export function getRecommendations({ bestSeller, highestProfit, deadStock, lowStock }) {
  const recs = []

  if (bestSeller) {
    recs.push({
      icon: 'trendingUp',
      color: '#5FD97A',
      title: `Promote ${bestSeller.name} at eye level`,
      detail: 'Placing your best seller at eye-level near the entrance increases impulse purchases by up to 20%.',
    })
  }

  if (highestProfit && highestProfit.name !== bestSeller?.name) {
    recs.push({
      icon: 'cash',
      color: '#F0A93D',
      title: `Bundle ${highestProfit.name} with a mixer`,
      detail: 'Cross-selling your highest-margin product with a complementary item lifts average basket size.',
    })
  }

  if (deadStock.length > 0) {
    recs.push({
      icon: 'package',
      color: '#7C5CFC',
      title: `Discount ${deadStock[0].name} to clear stock`,
      detail: 'A modest 10–15% markdown on slow movers frees up cash and shelf space for faster sellers.',
    })
  }

  if (lowStock.length > 0) {
    recs.push({
      icon: 'package',
      color: '#5B9FF0',
      title: 'Set up a standing order for fast movers',
      detail: 'Automating reorders for high-velocity products avoids stockouts during peak hours.',
    })
  }

  recs.push({
    icon: 'users',
    color: '#FF6B5B',
    title: 'Ask regulars about their preferences',
    detail: 'Personal recommendations build loyalty and increase repeat visits in wine & spirits retail.',
  })

  return recs.slice(0, 4)
}

// ── PREDICTIONS ──────────────────────────────────────────────────
export function getPredictions({ transactions }) {
  const sales = transactions.filter(t => t.operation_type === 'sale')

  if (sales.length < 5) {
    return { tomorrowRevenue: null, confidence: null, outlook: 'Not enough sales history yet for a reliable forecast.' }
  }

  const now = Date.now()
  const last14Days = sales.filter(t => {
    const ts = new Date(t.created_at || t.ts || now).getTime()
    return ts >= now - 14 * 24 * 60 * 60 * 1000
  })

  const dailyTotals = {}
  last14Days.forEach(t => {
    const d = new Date(t.created_at || t.ts || now)
    const key = d.toDateString()
    dailyTotals[key] = (dailyTotals[key] || 0) + t.amount
  })

  const values = Object.values(dailyTotals)
  const avg = values.length > 0 ? values.reduce((a, v) => a + v, 0) / values.length : 0
  const confidence = Math.min(92, 40 + values.length * 4)

  return {
    tomorrowRevenue: Math.round(avg),
    confidence,
    outlook: avg > 0
      ? `Expect a similar pace next week, around ${fmtKES(Math.round(avg * 7))} KES in total sales.`
      : 'Add more sales data for a next-week outlook.',
  }
}

// ── RISK ALERTS ──────────────────────────────────────────────────
export function getRiskAlerts({ lowStock, outOfStock, debtors, transactions }) {
  const alerts = []

  if (outOfStock.length > 0) {
    alerts.push({
      icon: 'alertTriangle',
      color: '#FF6B5B',
      title: `${outOfStock.length} product(s) out of stock`,
      detail: outOfStock.slice(0, 2).map(p => p.name).join(', '),
    })
  }

  if (lowStock.length > 0) {
    alerts.push({
      icon: 'package',
      color: '#F0A93D',
      title: `${lowStock.length} product(s) running low`,
      detail: lowStock.slice(0, 2).map(p => p.name).join(', '),
    })
  }

  if (debtors.length > 0) {
    const total = debtors.reduce((a, c) => a + (c.total_owed || 0), 0)
    alerts.push({
      icon: 'userDollar',
      color: '#5B9FF0',
      title: `${debtors.length} customer(s) have outstanding debt`,
      detail: `${fmtKES(total)} KES total owed`,
    })
  }

  const expenses = transactions.filter(t => t.operation_type === 'expense')
  if (expenses.length > 0) {
    const avgExpense = expenses.reduce((a, t) => a + t.amount, 0) / expenses.length
    const unusual = expenses.find(t => t.amount > avgExpense * 3)
    if (unusual) {
      alerts.push({
        icon: 'alertTriangle',
        color: '#FF9F43',
        title: 'Unusual expense detected',
        detail: `${fmtKES(unusual.amount)} KES — above your typical range`,
      })
    }
  }

  return alerts
}

// ── ASK DUKA AI (mock responses) ────────────────────────────────
export function generateMockResponse(question, context) {
  const q = question.toLowerCase()
  const { restockSuggestions, debtors, bestSeller, lowStock, predictions } = context

  if (q.includes('restock')) {
    if (restockSuggestions.length === 0) {
      return "Your stock levels look healthy right now — nothing urgent needs restocking."
    }
    const top = restockSuggestions[0]
    return `Based on your sales velocity, restock ${top.name} first — about ${top.recommended} units. Fast-moving spirits like this should never dip below a week's buffer stock.`
  }

  if (q.includes('profit') && q.includes('drop')) {
    return "Profit dips are usually driven by a mix of discounting and slow-moving stock tying up cash. Check your highest-cost, lowest-turnover items first — clearing them frees up margin."
  }

  if (q.includes('owes') || q.includes('debt')) {
    if (debtors.length === 0) return "No customers currently owe you money — your books are clean."
    const top = debtors[0]
    return `${top.name} owes the most at ${fmtKES(top.total_owed)} KES. A friendly reminder — ideally in person or via SMS — tends to work best with regulars.`
  }

  if (q.includes('weekend') || q.includes('predict')) {
    if (!predictions.tomorrowRevenue) return "I need a bit more sales history before I can forecast confidently — check back after a few more days of data."
    return `Weekends typically see a lift in wine & spirits sales. Based on your recent trend, expect around ${fmtKES(predictions.tomorrowRevenue)} KES on an average day this weekend — stock up on your top sellers beforehand.`
  }

  if (q.includes('increase sales') || q.includes('sell more')) {
    return `${bestSeller ? `${bestSeller.name} is already working well — feature it near checkout.` : 'Feature your top seller near checkout.'} Beyond that, bundling spirits with mixers and training staff to suggest a premium upgrade at checkout are proven levers in this category.`
  }

  return "I've looked at your business data — could you rephrase that, or try one of the suggestions above? I can help with restocking, debts, profit trends, and sales strategy."
}
