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
          new Date(b.created_at || b.ts).getTime() -
          new Date(a.created_at || a.ts).getTime()
      )[0]

    if (!lastSale) {
      alerts.push({
        id: `nosale-${product.id}`,
        type: 'warning',
        icon: 'barChart',
        title: 'No Sales',
        message: `${product.name} has never been sold.`,
      })
      return
    }

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

export function getInventoryHealth(products = [], transactions = []) {
  if (!products.length) {
    return {
      score: 100,
      label: 'Excellent',
      color: '#5FD97A',
      outOfStock: 0,
      lowStock: 0,
      inactive: 0,
    }
  }

  const total = products.length

  const outOfStock = products.filter(
    p => (p.stock_current ?? p.stock ?? 0) === 0
  ).length

  const lowStock = products.filter(p => {
    const stock = p.stock_current ?? p.stock ?? 0
    const alert = p.stock_alert ?? 5
    return stock > 0 && stock <= alert
  }).length

  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30

  const sales = transactions.filter(
    t => t.classified && t.operation_type === 'sale'
  )

  let inactive = 0

  products.forEach(product => {
    const lastSale = sales
      .filter(t => t.product_id === product.id)
      .sort(
        (a, b) =>
          new Date(b.created_at || b.ts).getTime() -
          new Date(a.created_at || a.ts).getTime()
      )[0]

    if (!lastSale) {
      inactive++
      return
    }

    const age =
      Date.now() -
      new Date(lastSale.created_at || lastSale.ts).getTime()

    if (age > THIRTY_DAYS) inactive++
  })

  let score = 100

  score -= (outOfStock / total) * 40
  score -= (lowStock / total) * 20
  score -= (inactive / total) * 20

  score = Math.max(0, Math.round(score))

  let label = 'Excellent'
  let color = '#5FD97A'

  if (score < 85) {
    label = 'Good'
    color = '#F0A93D'
  }

  if (score < 65) {
    label = 'Needs Attention'
    color = '#FF6B5B'
  }

  if (score < 40) {
    label = 'Critical'
    color = '#D62828'
  }

  return {
    score,
    label,
    color,
    outOfStock,
    lowStock,
    inactive,
  }
}
