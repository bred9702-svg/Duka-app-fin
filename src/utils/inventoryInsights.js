export function generateInventoryAlerts(products = [], transactions = []) {
  const alerts = []

  // Low stock
  products
    .filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5)
    .forEach((product) => {
      alerts.push({
        type: 'warning',
        icon: 'alertTriangle',
        title: 'Low stock',
        message: `${product.name} has only ${product.stock} left.`,
      })
    })

  // Out of stock
  products
    .filter((p) => (p.stock || 0) === 0)
    .forEach((product) => {
      alerts.push({
        type: 'danger',
        icon: 'package',
        title: 'Out of stock',
        message: `${product.name} is out of stock.`,
      })
    })

  return alerts
}
