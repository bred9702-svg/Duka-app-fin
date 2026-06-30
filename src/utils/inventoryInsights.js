export function generateInventoryAlerts(products = [], transactions = []) {
  const alerts = []
  const now = Date.now()
  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30

  // =========================
  // LOW STOCK
  // =========================
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

  // =========================
  // OUT OF STOCK
  // =========================
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

  // =========================
  // SALES
  // =========================
  const sales = transactions.filter(
    t => t.classified && t.operation_type === 'sale'
  )

  // =========================
  // BEST SELLER
  // =========================
  const sold = {}

  sales.forEach(sale => {
    if (!sale.product_id) return
    sold[sale.product_id] =
      (sold[sale.product_id] || 0) +
      (sale.quantity || 1)
  })

  let bestSeller = null

  Object.entries(sold).forEach(([id, qty]) => {
    if (!bestSeller || qty > bestSeller.qty) {
      bestSeller = { id, qty }
    }
  })

  if (bestSeller) {
    const product = products.find(p => p.id === bestSeller.id)

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

  // =========================
  // HIGHEST PROFIT
  // =========================
  const profits = {}

  sales.forEach(sale => {
    if (!sale.product_id) return
    profits[sale.product_id] =
      (profits[sale.product_id] || 0) +
      (sale.profit || 0)
  })

  let highestProfit = null

  Object.entries(profits).forEach(([id, profit]) => {
    if (!highestProfit || profit > highestProfit.profit) {
      highestProfit = { id, profit }
    }
  })

  if (highestProfit) {
    const product = products.find(p => p.id === highestProfit.id)

    if (product) {
      alerts.unshift({
        id: 'highest-profit',
        type: 'info',
        icon: 'coins',
        title: 'Highest Profit',
        message: `${product.name} generated KES ${highestProfit.profit.toLocaleString()}.`,
      })
    }
  }

  // =========================
  // NO SALES IN 30 DAYS
  // =========================
  products.forEach(product => {
    const lastSale = sales
      .filter(s => s.product_id === product.id)
      .sort(
        (a, b) =>
          new Date(b.created_at || b.ts) -
          new Date(a.created_at || a.ts)
      )[0]

    if (!lastSale) return

    const lastSaleTime = new Date(
      lastSale.created_at || lastSale.ts
    ).getTime()

    if (now - lastSaleTime > THIRTY_DAYS) {
      alerts.push({
        id: `nosale-${product.id}`,
        type: 'warning',
        icon: 'barChart',
        title: 'Slow Moving',
        message: `${product.name} hasn't sold in over 30 days.`,
      })
    }
  })

  return alerts
}
