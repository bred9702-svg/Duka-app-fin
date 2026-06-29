import { fmtKES } from './formatters'

export function generateSmartInsight(customers = [], transactions = []) {
  const debtors = customers
    .filter(c => (c.total_owed || 0) > 0)
    .sort((a, b) => (b.total_owed || 0) - (a.total_owed || 0))

  if (debtors.length === 0) {
    return {
      type: 'success',
      color: '#5FD97A',
      icon: 'circleCheck',
      title: 'Great job',
      message: 'No outstanding debts. Keep it up!',
    }
  }

  const totalOutstanding = debtors.reduce(
    (sum, c) => sum + (c.total_owed || 0),
    0
  )

  const topCustomer = debtors[0]

  const percentage =
    totalOutstanding > 0
      ? Math.round((topCustomer.total_owed / totalOutstanding) * 100)
      : 0

  if (percentage >= 50) {
    return {
      type: 'danger',
      color: '#FF6B5B',
      icon: 'alertTriangle',
      title: 'Priority collection',
      message: `Collecting from ${topCustomer.name} today would recover ${percentage}% of your outstanding balance.`,
    }
  }

  if (debtors.length >= 5) {
    return {
      type: 'warning',
      color: '#F0A93D',
      icon: 'clock',
      title: 'Multiple active debts',
      message: `You currently have ${debtors.length} customers with unpaid balances.`,
    }
  }

  return {
    type: 'info',
    color: '#5B9FF0',
    icon: 'sparkles',
    title: 'Smart Insight',
    message: `${topCustomer.name} owes ${fmtKES(
      topCustomer.total_owed
    )} KES. A reminder today could improve your cash flow.`,
  }
}
