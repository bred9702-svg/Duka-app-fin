const STORE_SETTINGS_KEY = 'duka-store-settings'
const DEFAULT_LOW_STOCK_THRESHOLD = 5

function getBusinessPreferences() {
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getLowStockThreshold() {
  const settings = getBusinessPreferences()
  const threshold = Number(settings.lowStockThreshold)
  return Number.isFinite(threshold) && threshold > 0
    ? threshold
    : DEFAULT_LOW_STOCK_THRESHOLD
}

export function areStockAlertsEnabled() {
  const settings = getBusinessPreferences()
  return settings.stockAlerts !== false
}

function getProductLowStockLimit(product) {
  const globalThreshold = getLowStockThreshold()
  const productThreshold = Number(product?.stock_alert)

  return Number.isFinite(productThreshold) && productThreshold > 0
    ? productThreshold
    : globalThreshold
}

function isLowStockProduct(product) {
  if (!areStockAlertsEnabled()) return false

  const stock = product?.stock_current ?? 0
  return stock > 0 && stock <= getProductLowStockLimit(product)
}

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

  const lowStock = products.filter(isLowStockProduct).length

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
  return products.filter(isLowStockProduct)
}

export function getOutOfStock(products = []) {
  return products.filter(
    p => (p.stock_current ?? 0) <= 0
  )
}

export function getDeadStock(
  products = [],
  transactions = []
) {
  const sold = new Set()

  transactions
    .filter(t => t.operation_type === 'sale')
    .forEach(t => {
      if (t.product_id) {
        sold.add(t.product_id)
      }
    })

  return products.filter(
    p =>
      (p.stock_current ?? 0) > 0 &&
      !sold.has(p.id)
  )
}

export function getRestockSuggestions(
  products = [],
  transactions = []
) {
  if (!areStockAlertsEnabled()) return []

  const sales = {}

  transactions
    .filter(t => t.operation_type === 'sale')
    .forEach(t => {
      if (!t.product_id) return

      sales[t.product_id] =
        (sales[t.product_id] || 0) +
        (t.quantity || 1)
    })

  return products
    .filter(isLowStockProduct)
    .map(product => {
      const sold = sales[product.id] || 0
      const lowStockLimit = getProductLowStockLimit(product)

      const recommended =
        Math.max(
          lowStockLimit * 2,
          sold
        ) - (product.stock_current ?? 0)

      return {
        ...product,
        stock_alert: lowStockLimit,
        sold,
        recommended: Math.max(
          0,
          Math.round(recommended)
        ),
      }
    })
    .filter(p => p.recommended > 0)
    .sort(
      (a, b) => b.recommended - a.recommended
    )
}