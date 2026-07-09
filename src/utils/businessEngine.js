export function generateBusinessReport({
  products = [],
  transactions = [],
}) {
  const report = {
    opportunities: [],
    risks: [],
    recommendations: [],
  }

  // ---------- Low stock ----------
  const lowStock = products.filter(
    p =>
      (p.stock_current ?? 0) > 0 &&
      (p.stock_current ?? 0) <= (p.stock_alert ?? 5)
  )

  if (lowStock.length) {
    report.risks.push({
      id: 'low-stock',
      icon: '⚠️',
      title: 'Low Stock',
      message: `${lowStock.length} product(s) are running low.`,
    })
  }

  // ---------- Out of stock ----------
  const outOfStock = products.filter(
    p => (p.stock_current ?? 0) <= 0
  )

  if (outOfStock.length) {
    report.risks.push({
      id: 'out-stock',
      icon: '📦',
      title: 'Out of Stock',
      message: `${outOfStock.length} product(s) are out of stock.`,
    })
  }

  // ---------- Best seller ----------
  const sales = {}

  transactions
    .filter(t => t.operation_type === 'sale')
    .forEach(t => {
      if (!t.product_id) return

      sales[t.product_id] =
        (sales[t.product_id] || 0) +
        (t.quantity || 1)
    })

  let bestId = null
  let bestQty = 0

  Object.entries(sales).forEach(([id, qty]) => {
    if (qty > bestQty) {
      bestId = id
      bestQty = qty
    }
  })

  if (bestId) {
    const product = products.find(
      p => p.id === bestId
    )

    if (product) {
      report.opportunities.push({
        id: 'best-seller',
        icon: '🔥',
        title: 'Best Seller',
        message: `${product.name} is currently your best-selling product.`,
      })
    }
  }

  // ---------- Recommendation ----------
  if (lowStock.length || outOfStock.length) {
    report.recommendations.push({
      id: 'restock',
      icon: '🛒',
      title: 'Restock',
      message:
        'Consider placing a purchase order today.',
    })
  }

  return report
}
