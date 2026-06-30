export function getInventoryHealth(products = [], transactions = []) {
  if (!products.length) {
    return {
      score: 100,
      label: 'Excellent',
      color: '#5FD97A',
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
          new Date(b.created_at || b.ts) -
          new Date(a.created_at || a.ts)
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
