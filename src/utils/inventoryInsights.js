export function generateInventoryAlerts(products = [], transactions = []) {
  const alerts = []

  // LOW STOCK
  products
    .filter(p => (p.stock_current ?? p.stock ?? 0) > 0)
    .filter(p => (p.stock_current ?? p.stock ?? 0) <= (p.stock_alert ?? 5))
    .forEach(product => {
      alerts.push({
        id: `low-${product.id}`,
        type: 'warning',
        icon: 'alertTriangle',
        title: 'Low Stock',
        message: `${product.name} has only ${product.stock_current ?? product.stock} units left.`,
      })
    })

  // OUT OF STOCK
  products
    .filter(p => (p.stock_current ?? p.stock ?? 0) === 0)
    .forEach(product => {
      alerts.push({
        id: `out-${product.id}`,
        type: 'danger',
        icon: 'package',
        title: 'Out of Stock',
        message: `${product.name} is out of stock.`,
      })
    })

  // SALES ONLY
  const sales = transactions.filter(
    t => t.classified && t.operation_type === 'sale'
  )

  // BEST SELLER
  const sold = {}

  sales.forEach(sale => {
    if (!sale.product_id) return

    sold[sale.product_id] =
      (sold[sale.product_id] || 0) +
      (sale.quantity || 1)
  })

  let bestId = null
  let bestQty = 0

  Object.entries(sold).forEach(([id, qty]) => {
    if (qty > bestQty) {
      bestQty = qty
      bestId = id
    }
  })

  if (bestId) {
    const product = products.find(p => p.id === bestId)

    if (product) {
      alerts.unshift({
        id: 'best-seller',
        type: 'success',
        icon: 'trendingUp',
        title: 'Best Seller',
        message: `${product.name} sold ${bestQty} units.`,
      })
    }
  }

  // HIGHEST PROFIT
  const profits = {}

  sales.forEach(sale => {
    if (!sale.product_id) return

    profits[sale.product_id] =
      (profits[sale.product_id] || 0) +
      (sale.profit || 0)
  })

  let profitId = null
  let maxProfit = 0

  Object.entries(profits).forEach(([id, value]) => {
    if (value > maxProfit) {
      maxProfit = value
      profitId = id
    }
  })

  if (profitId) {
    const product = products.find(p => p.id === profitId)

    if (product) {
      alerts.unshift({
        id: 'profit',
        type: 'info',
        icon: 'coins',
        title: 'Highest Profit',
        message: `${product.name} generated KES ${maxProfit.toLocaleString()}.`,
      })
    }
  }

  return alerts
}
