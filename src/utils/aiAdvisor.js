export function generateBusinessInsights({
  health,
  bestSeller,
  highestProfit,
  lowStock,
  outOfStock,
  deadStock,
  suggestions,
}) {
  const insights = []

  if (health.score >= 90) {
    insights.push({
      type: 'success',
      icon: '🟢',
      message: 'Your inventory is in excellent condition.',
    })
  } else if (health.score >= 70) {
    insights.push({
      type: 'warning',
      icon: '🟡',
      message: 'Your inventory is healthy but needs attention.',
    })
  } else {
    insights.push({
      type: 'danger',
      icon: '🔴',
      message: 'Your inventory requires immediate action.',
    })
  }

  if (bestSeller) {
    insights.push({
      type: 'info',
      icon: '🔥',
      message: `${bestSeller.name} is your best-selling product.`,
    })
  }

  if (highestProfit) {
    insights.push({
      type: 'info',
      icon: '💰',
      message: `${highestProfit.name} generates the highest profit.`,
    })
  }

  if (outOfStock.length > 0) {
    insights.push({
      type: 'danger',
      icon: '📦',
      message: `${outOfStock.length} product(s) are out of stock.`,
    })
  }

  if (lowStock.length > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      message: `${lowStock.length} product(s) are running low.`,
    })
  }

  if (deadStock.length > 0) {
    insights.push({
      type: 'warning',
      icon: '😴',
      message: `${deadStock.length} product(s) have never been sold.`,
    })
  }

  if (suggestions.length > 0) {
    insights.push({
      type: 'info',
      icon: '🛒',
      message: `${suggestions.length} products should be reordered.`,
    })
  }

  return insights
}
