export function generateInventoryAlerts(products = [], transactions = []) {
  const alerts = []

  // =========================
  // LOW STOCK
  // =========================
  products
    .filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5)
    .forEach((product) => {
      alerts.push({
        id: `low-${product.id}`,
        type: 'warning',
        icon: 'alertTriangle',
        title: 'Low Stock',
        message: `${product.name} has only ${product.stock} left.`,
      })
    })

  // =========================
  // OUT OF STOCK
  // =========================
  products
    .filter((p) => (p.stock || 0) === 0)
    .forEach((product) => {
      alerts.push({
        id: `out-${product.id}`,
        type: 'danger',
        icon: 'package',
        title: 'Out of Stock',
        message: `${product.name} is out of stock.`,
      })
    })

  // =========================
  // BEST SELLER
  // =========================
  const sales = transactions.filter(
    (t) => t.operation_type === 'sale'
  )

  const totals = {}

  sales.forEach((sale) => {
    if (!sale.product_id) return

    totals[sale.product_id] =
      (totals[sale.product_id] || 0) +
      (sale.quantity || 1)
  })

  let bestSeller = null

  Object.entries(totals).forEach(([productId, qty]) => {
    if (!bestSeller || qty > bestSeller.qty) {
      bestSeller = { productId, qty }
    }
  })

  if (bestSeller) {
    const product = products.find(
      (p) => p.id === bestSeller.productId
    )

    if (product) {
      alerts.unshift({
        id: 'best-seller',
        type: 'success',
        icon: 'trendingUp',
        title: 'Best Seller',
        message: `${product.name} sold ${bestSeller.qty} units.`,
      })
    }
  }

  return alerts
}
