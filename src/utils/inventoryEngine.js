export function getInventoryHealth(products = []) {
  if (!products.length) {
    return {
      score: 100,
      status: 'Excellent',
      color: '#5FD97A',
    }
  }

  const total = products.length

  const outOfStock = products.filter(
    p => (p.stock_current ?? 0) <= 0
  ).length

  const lowStock = products.filter(
    p =>
      (p.stock_current ?? 0) > 0 &&
      (p.stock_current ?? 0) <= (p.stock_alert ?? 5)
  ).length

  let score = 100

  score -= (outOfStock / total) * 50
  score -= (lowStock / total) * 25

  score = Math.max(0, Math.round(score))

  let status = 'Excellent'
  let color = '#5FD97A'

  if (score < 85) {
    status = 'Good'
    color = '#F0A93D'
  }

  if (score < 65) {
    status = 'Needs Attention'
    color = '#FF8A4C'
  }

  if (score < 40) {
    status = 'Critical'
    color = '#FF5C5C'
  }

  return {
    score,
    status,
    color,
    totalProducts: total,
    lowStock,
    outOfStock,
  }
}

export function getBestSeller(products = [], transactions = []) {
  const sales = transactions.filter(
    t =>
      t.operation_type === 'sale' &&
      t.product_id
  )

  const map = {}

  sales.forEach(t => {
    map[t.product_id] =
      (map[t.product_id] || 0) +
      (t.quantity || 1)
  })

  let winner = null

  Object.entries(map).forEach(([id, qty]) => {
    if (!winner || qty > winner.qty)
      winner = { id, qty }
  })

  if (!winner) return null

  const product = products.find(
    p => p.id === winner.id
  )

  if (!product) return null

  return {
    ...product,
    sold: winner.qty,
  }
}

export function getHighestProfit(products = [], transactions = []) {
  const profits = {}

  transactions
    .filter(t => t.operation_type === 'sale')
    .forEach(t => {
      if (!t.product_id) return

      profits[t.product_id] =
        (profits[t.product_id] || 0) +
        (t.profit || 0)
    })

  let winner = null

  Object.entries(profits).forEach(([id, value]) => {
    if (!winner || value > winner.value)
      winner = { id, value }
  })

  if (!winner) return null

  const product = products.find(
    p => p.id === winner.id
  )

  if (!product) return null

  return {
    ...product,
    profit: winner.value,
  }
}

export function getLowStock(products = []) {
  return products.filter(
    p =>
      (p.stock_current ?? 0) > 0 &&
      (p.stock_current ?? 0) <= (p.stock_alert ?? 5)
  )
}

export function getOutOfStock(products = []) {
  return products.filter(
    p => (p.stock_current ?? 0) <= 0
  )
}
